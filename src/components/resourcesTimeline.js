/*
Logic for Resource Timing API Waterfall
*/

import data from "../data";
import dom from "../helpers/dom";
import waterfall from "../helpers/waterfall";

class ResourceTimelineComponent {
    constructor(options = {}) {
        this.domain = options.domain || "all";
        this.startTime = options.startTime || 0;
        this.endTime = options.endTime || null;
        this.markFrom = options.markFrom || null;
        this.excludeDomainPattern = options.excludeDomainPattern || "";
        this.includeDomainPattern = options.includeDomainPattern || "";
        this.excludeMarkPattern = options.excludeMarkPattern || "";
        this.includeMarkPattern = options.includeMarkPattern || "";
        this.maxTime = (options.maxTime || (5 * 60)) * 1000; // default to 5 minutes, timeline could be messy, use time filters to zoom in
    }

    /**
     * Check if the timeline is partial, i.e. if it is zoomed in
     * @returns {boolean}
     */
    isPartial() {
        return !(this.startTime === 0 && this.endTime === null);
    }

    getChartData(filter) {
        const self = this;
        const calc = {
            pageLoadTime : data.perfTiming.loadEventEnd - data.perfTiming.responseStart,
            lastResponseEnd : data.perfTiming.loadEventEnd - data.perfTiming.responseStart,
        };


        for (let perfProp in data.perfTiming) {
            if(data.perfTiming[perfProp] && typeof data.perfTiming[perfProp] === "number"){
                calc[perfProp] = data.perfTiming[perfProp] - data.perfTiming.navigationStart;
            }
        }

        const onDomLoad = waterfall.timeBlock("domContentLoaded Event", calc.domContentLoadedEventStart, calc.domContentLoadedEventEnd, "block-dom-content-loaded");
        const onLoadEvt = waterfall.timeBlock("Onload Event", calc.loadEventStart, calc.loadEventEnd, "block-onload");
        const navigationApiTotal = [
            waterfall.timeBlock("Unload", calc.unloadEventStart, calc.unloadEventEnd, "block-unload"),
            waterfall.timeBlock("Redirect", calc.redirectStart, calc.redirectEnd, "block-redirect"),
            waterfall.timeBlock("App cache", calc.fetchStart, calc.domainLookupStart, "block-appcache"),
            waterfall.timeBlock("DNS", calc.domainLookupStart, calc.domainLookupEnd, "block-dns"),
            waterfall.timeBlock("TCP", calc.connectStart, calc.connectEnd, "block-tcp"),
            waterfall.timeBlock("Timer to First Byte", calc.requestStart, calc.responseStart, "block-ttfb"),
            waterfall.timeBlock("Response", calc.responseStart, calc.responseEnd, "block-response"),
            waterfall.timeBlock("DOM Processing", calc.domLoading, calc.domComplete, "block-dom"),
            onDomLoad,
            onLoadEvt
        ];

        if(calc.secureConnectionStart){
            navigationApiTotal.push(waterfall.timeBlock("SSL", calc.secureConnectionStart, calc.connectEnd, "block-ssl"));
        }
        if(calc.msFirstPaint){
            navigationApiTotal.push(waterfall.timeBlock("msFirstPaint Event", calc.msFirstPaint, calc.msFirstPaint, "block-ms-first-paint-event"));
        }
        if(calc.domInteractive){
            navigationApiTotal.push(waterfall.timeBlock("domInteractive Event", calc.domInteractive, calc.domInteractive, "block-dom-interactive-event"));
        }
        if(!calc.redirectEnd && !calc.redirectStart && calc.fetchStart > calc.navigationStart){
            navigationApiTotal.push(waterfall.timeBlock("Cross-Domain Redirect", calc.navigationStart, calc.fetchStart, "block-redirect"));
        }

        calc.blocks = self.isPartial()
            ? []
            : [
                waterfall.timeBlock("Navigation API total", 0, calc.loadEventEnd, "block-navigation-api-total", navigationApiTotal),
            ];

        data.allResourcesCalc.filter((resource) => {
            //do not show items up to 20 seconds after onload - else beacon ping etc make diagram useless
            return resource.startTime < (calc.loadEventEnd + this.maxTime)
        })
            .filter(filter||(() => true))
            .forEach((resource, i) => {
                const segments = [
                    waterfall.timeBlock("Redirect", resource.redirectStart, resource.redirectEnd, "block-redirect"),
                    waterfall.timeBlock("DNS Lookup", resource.domainLookupStart, resource.domainLookupEnd, "block-dns"),
                    waterfall.timeBlock("Initial Connection (TCP)", resource.connectStart, resource.connectEnd, "block-dns"),
                    waterfall.timeBlock("secureConnect", resource.secureConnectionStart||undefined, resource.connectEnd, "block-ssl"),
                    waterfall.timeBlock("Timer to First Byte", resource.requestStart, resource.responseStart, "block-ttfb"),
                    waterfall.timeBlock("Content Download", resource.responseStart||undefined, resource.responseEnd, "block-response")
                ];

                const resourceTimings = [0, resource.redirectStart, resource.domainLookupStart, resource.connectStart, resource.secureConnectionStart, resource.requestStart, resource.responseStart];

                const firstTiming = resourceTimings.reduce((currMinTiming, currentValue) => {
                    if(currentValue > 0 && (currentValue < currMinTiming || currMinTiming <= 0) && currentValue != resource.startTime){
                        return currentValue;
                    } else {
                        return currMinTiming;
                    }
                });

                if(resource.startTime < firstTiming){
                    segments.unshift(waterfall.timeBlock("Stalled/Blocking", resource.startTime, firstTiming, "block-blocking"));
                }

                calc.blocks.push(waterfall.timeBlock(resource.name, resource.startTime, resource.responseEnd, "block-" + resource.initiatorType, segments, resource));
                calc.lastResponseEnd = Math.max(calc.lastResponseEnd,resource.responseEnd);
            });

        const loadDuration = self.isPartial()
            ? Math.max(
                (calc.blocks.map((it) => it.end).reduce((r, v) => Math.max(r, v), 1000) || self.startTime * 1000) - self.startTime * 1000,
                ((self.endTime || self.startTime) - self.startTime + 1) * 1000) 
            : Math.round(Math.max(calc.lastResponseEnd, (data.perfTiming.loadEventEnd-data.perfTiming.navigationStart)));

        return {
            loadDuration,
            blocks : calc.blocks,
            bg : [
                onDomLoad,
                onLoadEvt
            ]
        };

    }

    refreshSVG(chartHolder) {
        const self = this;
        const startTimeInMs = self.startTime * 1000;
        const endTimeLimitInMs = self.endTime ? self.endTime * 1000 : null;
        const includeRegex = (self.includeDomainPattern && self.includeDomainPattern.trim() !== "")
            ? new RegExp(self.includeDomainPattern)
            : null;
        const excludeRegex = (self.excludeDomainPattern && self.excludeDomainPattern.trim() !== "")
            ? new RegExp(self.excludeDomainPattern)
            : null;
        const includeMarkRegex = (self.includeMarkPattern && self.includeMarkPattern.trim() !== "")
            ? new RegExp(self.includeMarkPattern)
            : null;
        const excludeMarkRegex = (self.excludeMarkPattern && self.excludeMarkPattern.trim() !== "")
            ? new RegExp(self.excludeMarkPattern)
            : null;
        // Resource filter
        const chartData = self.getChartData((resource) =>
            (self.domain === "all" || resource.domain === self.domain) &&
            resource.startTime >= startTimeInMs &&
            (!endTimeLimitInMs || resource.startTime <= endTimeLimitInMs) &&
            (!includeRegex || includeRegex.exec(resource.name)) &&
            (!excludeRegex || !excludeRegex.exec(resource.name))
        );
        const endTimeInMs = startTimeInMs + chartData.loadDuration;
        const tempChartHolder = waterfall.setupTimeLine(
            self.startTime,
            chartData.loadDuration,
            chartData.blocks,
            // Mark filter
            data.marks.filter((it) =>
                it.startTime >= startTimeInMs &&
                it.startTime <= endTimeInMs &&
                (!self.markFrom || it.startTime >= self.markFrom * 1000) &&
                (!includeMarkRegex || includeMarkRegex.exec(it.name)) &&
                (!excludeMarkRegex || !excludeMarkRegex.exec(it.name))
            ),
            chartData.bg,
            "Temp",
        );
        const oldSVG = chartHolder.getElementsByClassName("water-fall-chart")[0];
        const newSVG = tempChartHolder.getElementsByClassName("water-fall-chart")[0];
        chartHolder.replaceChild(newSVG, oldSVG);
    }

    init() {
        const self = this;
        let chartData = self.getChartData();
        const chartHolder = waterfall.setupTimeLine(self.startTime, chartData.loadDuration, chartData.blocks, data.marks, chartData.bg, "Resource Timing");
        const chartSvg = chartHolder.getElementsByClassName("water-fall-chart")[0];

        // Create configuration panel
        const configPanel = dom.newTag("div", {
            class: "config-panel",
            style: "margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; display: flex; justify-content: flex-end; gap: 10px; align-items: center;"
        });

        // Domain selector
        if(data.requestsByDomain.length > 1) {
            const selectBox = dom.newTag("select", {
                class: "domain-selector",
                style: "width: 150px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;",
                onchange: (e) => {
                    self.domain = e.target.options[e.target.selectedIndex].value;
                    self.refreshSVG(chartHolder);
                }
            });

            selectBox.appendChild(dom.newTag("option", {
                text: "Show all",
                value: "all",
                selected: self.domain === "all"
            }));

            data.requestsByDomain.forEach((domain) => {
                selectBox.appendChild(dom.newTag("option", {
                    text: domain.domain,
                    selected: self.domain === domain.domain
                }));
            });

            configPanel.appendChild(selectBox);
        }

        // Add start time selector
        const startTimeSelector = dom.newTag("input", {
            class: "start-time-selector",
            type: "text",
            placeholder: "From (seconds)",
            value: self.startTime || "0",
            style: "width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;",
            onblur: (e) => {
                const time = e.target.value;
                self.startTime = time ? parseInt(time) : 0;
                self.refreshSVG(chartHolder);
            },
            onkeydown: (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            }
        });
        configPanel.appendChild(startTimeSelector);

        // Add end time selector
        const endTimeSelector = dom.newTag("input", {
            class: "end-time-selector",
            type: "text",
            placeholder: "To (seconds)",
            value: self.endTime || "",
            style: "width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;",
            onblur: (e) => {
                const time = e.target.value;
                self.endTime = time ? parseInt(time) : null;
                self.refreshSVG(chartHolder);
            },
            onkeydown: (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            }
        });
        configPanel.appendChild(endTimeSelector);

        // Add mark from selector
        const markFromSelector = dom.newTag("input", {
            class: "mark-from-selector",
            type: "text",
            placeholder: "Mark From (seconds)",
            value: self.markFrom || "",
            style: "width: 120px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;",
            onblur: (e) => {
                const time = e.target.value;
                self.markFrom = time ? parseInt(time) : null;
                self.refreshSVG(chartHolder);
            },
            onkeydown: (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            }
        });
        configPanel.appendChild(markFromSelector);

        // Add include pattern editor
        const includeDomainPatternEditor = dom.newTag("textarea", {
            class: "include-pattern-editor",
            placeholder: "Include pattern",
            value: self.includeDomainPattern,
            style: "width: 150px; min-height: 20px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; resize: none; overflow: hidden;",
            oninput: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
            },
            onblur: (e) => {
                self.includeDomainPattern = e.target.value.trim() || "";
                self.refreshSVG(chartHolder);
            }
        });
        includeDomainPatternEditor.textContent = self.includeDomainPattern;
        configPanel.appendChild(includeDomainPatternEditor);

        // Add exclude pattern editor
        const excludeDomainPatternEditor = dom.newTag("textarea", {
            class: "exclude-pattern-editor",
            placeholder: "Exclude pattern",
            value: self.excludeDomainPattern,
            style: "width: 150px; min-height: 20px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; resize: none; overflow: hidden;",
            oninput: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
            },
            onblur: (e) => {
                self.excludeDomainPattern = e.target.value.trim() || "";
                self.refreshSVG(chartHolder);
            }
        });
        excludeDomainPatternEditor.textContent = self.excludeDomainPattern;
        configPanel.appendChild(excludeDomainPatternEditor);

        // Add mark include pattern editor
        const includeMarkPatternEditor = dom.newTag("textarea", {
            class: "include-mark-pattern-editor",
            placeholder: "Include mark pattern",
            value: self.includeMarkPattern,
            style: "width: 150px; min-height: 20px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; resize: none; overflow: hidden;",
            oninput: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
            },
            onblur: (e) => {
                self.includeMarkPattern = e.target.value.trim() || "";
                self.refreshSVG(chartHolder);
            }
        });
        includeMarkPatternEditor.textContent = self.includeMarkPattern;
        configPanel.appendChild(includeMarkPatternEditor);

        // Add mark exclude pattern editor
        const excludeMarkPatternEditor = dom.newTag("textarea", {
            class: "exclude-mark-pattern-editor",
            placeholder: "Exclude mark pattern",
            value: self.excludeMarkPattern,
            style: "width: 150px; min-height: 20px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; resize: none; overflow: hidden;",
            oninput: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
            },
            onblur: (e) => {
                self.excludeMarkPattern = e.target.value.trim() || "";
                self.refreshSVG(chartHolder);
            }
        });
        excludeMarkPatternEditor.textContent = self.excludeMarkPattern;
        configPanel.appendChild(excludeMarkPatternEditor);

        // Insert the config panel before the chart
        chartSvg.parentNode.insertBefore(configPanel, chartSvg);

        return chartHolder;
    }
}

export default ResourceTimelineComponent;
