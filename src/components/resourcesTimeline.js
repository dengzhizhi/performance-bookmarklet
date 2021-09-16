/*
Logic for Resource Timing API Waterfall
*/

import data from "../data";
import dom from "../helpers/dom";
import waterfall from "../helpers/waterfall";

class ResourceTimelineComponent {
    constructor() {
        this.domain = "all";
        this.startTime = 0;
        this.endTime = null;
    }

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
            return resource.startTime < (calc.loadEventEnd + 20000)
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
            ? Math.max((calc.blocks.map((it) => it.end).reduce((r, v) => Math.max(r, v), 1000) || self.startTime * 1000) - self.startTime * 1000, 1000) 
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
        const chartData = self.getChartData((resource) =>
            (self.domain === "all" || resource.domain === self.domain) &&
            resource.startTime >= startTimeInMs &&
            (!endTimeLimitInMs || resource.startTime <= endTimeLimitInMs)
        );
        const endTimeInMs = startTimeInMs + chartData.loadDuration;
        const tempChartHolder = waterfall.setupTimeLine(
            self.startTime,
            chartData.loadDuration,
            chartData.blocks,
            data.marks.filter((it) => it.startTime >= startTimeInMs && it.startTime <= endTimeInMs),
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

        // Add end time selector
        const endTimeSelector = dom.newTag("select", {
            class: "end-time-selector",
            onchange: (e) => {
                const time = e.target.options[e.target.selectedIndex].value;
                self.endTime = time !== "all" ? parseInt(time) : null;
                self.refreshSVG(chartHolder);
            }
        });
        endTimeSelector.appendChild(dom.newTag("option", {
            text : "To",
            value : "all",
        }));
        for (let i = 1; i <= 25; i++) {
            endTimeSelector.appendChild(dom.newTag("option", {
                text : i
            }));
        }
        chartSvg.parentNode.insertBefore(endTimeSelector, chartSvg);

        // Add start time selector
        const startTimeSelector = dom.newTag("select", {
            class: "start-time-selector",
            onchange: (e) => {
                const time = e.target.options[e.target.selectedIndex].value;
                self.startTime = time ? parseInt(time) : 0;
                self.refreshSVG(chartHolder);
            }
        });
        startTimeSelector.appendChild(dom.newTag("option", {
            text : "From",
            value : "0",
        }));
        for (let i = 1; i <= 20; i++) {
            startTimeSelector.appendChild(dom.newTag("option", {
                text : i
            }));
        }
        chartSvg.parentNode.insertBefore(startTimeSelector, chartSvg);

        // Domain selector
        if(data.requestsByDomain.length > 1){
            debugger;
            const selectBox = dom.newTag("select", {
                class : "domain-selector",
                onchange : (e) => {
                    self.domain = e.target.options[e.target.selectedIndex].value;
                    self.refreshSVG(chartHolder);
                },
            });

            selectBox.appendChild(dom.newTag("option", {
                text : "show all",
                value : "all"
            }));

            data.requestsByDomain.forEach((domain) => {
                selectBox.appendChild(dom.newTag("option", {
                    text : domain.domain
                }));
            });
            chartSvg.parentNode.insertBefore(selectBox, chartSvg);
        }

        return chartHolder;
    }
}

export default ResourceTimelineComponent;
