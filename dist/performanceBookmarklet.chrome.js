/* https://github.com/dengzhizhi/performance-bookmarklet/tree/enhanced-resource-timeline by Zhizhi Deng
   build:01/10/2021 */

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _dom = _interopRequireDefault(require("../helpers/dom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
Logic for Legned
*/
var legendComponent = {};

var createLegend = function createLegend(className, title, dlArray) {
  var legendHolder = _dom["default"].newTag("div", {
    "class": "legend-holder"
  });

  legendHolder.appendChild(_dom["default"].newTag("h4", {
    text: title
  }));

  var dl = _dom["default"].newTag("dl", {
    "class": "legend " + className
  });

  dlArray.forEach(function (definition) {
    dl.appendChild(_dom["default"].newTag("dt", {
      "class": "colorBoxHolder",
      childElement: _dom["default"].newTag("span", {}, "background:" + definition[1])
    }));
    dl.appendChild(_dom["default"].newTag("dd", {
      text: definition[0]
    }));
  });
  legendHolder.appendChild(dl);
  return legendHolder;
}; //Legend


legendComponent.init = function () {
  var chartHolder = _dom["default"].newTag("section", {
    "class": "resource-timing chart-holder"
  });

  chartHolder.appendChild(_dom["default"].newTag("h3", {
    text: "Legend"
  }));

  var legendsHolder = _dom["default"].newTag("div", {
    "class": "legends-group "
  });

  legendsHolder.appendChild(createLegend("initiator-type-legend", "Block color: Initiator Type", [["css", "#afd899"], ["iframe", "#85b3f2"], ["img", "#bc9dd6"], ["script", "#e7bd8c"], ["link", "#89afe6"], ["swf", "#4db3ba"], //["font", "#e96859"],
  ["xmlhttprequest", "#e7d98c"]]));
  legendsHolder.appendChild(createLegend("navigation-legend", "Navigation Timing", [["Redirect", "#ffff60"], ["App Cache", "#1f831f"], ["DNS Lookup", "#1f7c83"], ["TCP", "#e58226"], ["SSL Negotiation", "#c141cd"], ["Time to First Byte", "#1fe11f"], ["Content Download", "#1977dd"], ["DOM Processing", "#9cc"], ["DOM Content Loaded", "#d888df"], ["On Load", "#c0c0ff"]]));
  legendsHolder.appendChild(createLegend("resource-legend", "Resource Timing", [["Stalled/Blocking", "#cdcdcd"], ["Redirect", "#ffff60"], ["App Cache", "#1f831f"], ["DNS Lookup", "#1f7c83"], ["TCP", "#e58226"], ["SSL Negotiation", "#c141cd"], ["Initial Connection (TCP)", "#e58226"], ["Time to First Byte", "#1fe11f"], ["Content Download", "#1977dd"]]));
  chartHolder.appendChild(legendsHolder);
  return chartHolder;
};

var _default = legendComponent;
exports["default"] = _default;


},{"../helpers/dom":6}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _data = _interopRequireDefault(require("../data"));

var _tableLogger = _interopRequireDefault(require("../helpers/tableLogger"));

var _waterfall = _interopRequireDefault(require("../helpers/waterfall"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
Logic for Naviagtion Timing API and Markers Waterfall
*/
var navigationTimelineComponent = {};

navigationTimelineComponent.init = function () {
  var startTime = _data["default"].perfTiming.navigationStart;
  var perfTimingCalc = {
    "pageLoadTime": _data["default"].perfTiming.loadEventEnd - _data["default"].perfTiming.navigationStart,
    "output": []
  };

  for (var perfProp in _data["default"].perfTiming) {
    if (_data["default"].perfTiming[perfProp] && typeof _data["default"].perfTiming[perfProp] === "number") {
      perfTimingCalc[perfProp] = _data["default"].perfTiming[perfProp] - startTime;
      perfTimingCalc.output.push({
        "name": perfProp,
        "time (ms)": _data["default"].perfTiming[perfProp] - startTime
      });
    }
  }

  perfTimingCalc.output.sort(function (a, b) {
    return (a["time (ms)"] || 0) - (b["time (ms)"] || 0);
  });
  perfTimingCalc.blocks = [_waterfall["default"].timeBlock("Total", 0, perfTimingCalc.pageLoadTime, "block-total"), _waterfall["default"].timeBlock("Unload", perfTimingCalc.unloadEventStart, perfTimingCalc.unloadEventEnd, "block-unload"), _waterfall["default"].timeBlock("Redirect (" + performance.navigation.redirectCount + "x)", perfTimingCalc.redirectStart, perfTimingCalc.redirectEnd, "block-redirect"), _waterfall["default"].timeBlock("App cache", perfTimingCalc.fetchStart, perfTimingCalc.domainLookupStart, "block-appcache"), _waterfall["default"].timeBlock("DNS", perfTimingCalc.domainLookupStart, perfTimingCalc.domainLookupEnd, "block-dns"), _waterfall["default"].timeBlock("TCP", perfTimingCalc.connectStart, perfTimingCalc.connectEnd, "block-tcp"), _waterfall["default"].timeBlock("Time to First Byte", perfTimingCalc.requestStart, perfTimingCalc.responseStart, "block-ttfb"), _waterfall["default"].timeBlock("Response", perfTimingCalc.responseStart, perfTimingCalc.responseEnd, "block-response"), _waterfall["default"].timeBlock("DOM Processing", perfTimingCalc.domLoading, perfTimingCalc.domComplete, "block-dom"), _waterfall["default"].timeBlock("domContentLoaded Event", perfTimingCalc.domContentLoadedEventStart, perfTimingCalc.domContentLoadedEventEnd, "block-dom-content-loaded"), _waterfall["default"].timeBlock("onload Event", perfTimingCalc.loadEventStart, perfTimingCalc.loadEventEnd, "block-onload")];

  if (perfTimingCalc.secureConnectionStart) {
    perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("SSL", perfTimingCalc.secureConnectionStart, perfTimingCalc.connectEnd, "block-ssl"));
  }

  if (perfTimingCalc.msFirstPaint) {
    perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("msFirstPaint Event", perfTimingCalc.msFirstPaint, perfTimingCalc.msFirstPaint, "block-ms-first-paint-event"));
  }

  if (perfTimingCalc.domInteractive) {
    perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("domInteractive Event", perfTimingCalc.domInteractive, perfTimingCalc.domInteractive, "block-dom-interactive-event"));
  }

  if (!perfTimingCalc.redirectEnd && !perfTimingCalc.redirectStart && perfTimingCalc.fetchStart > perfTimingCalc.navigationStart) {
    perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("Cross-Domain Redirect (and/or other Delay)", perfTimingCalc.navigationStart, perfTimingCalc.fetchStart, "block-redirect"));
  }

  perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("Network/Server", perfTimingCalc.navigationStart, perfTimingCalc.responseStart, "block-network-server")); //add measures to be added as bars

  _data["default"].measures.forEach(function (measure) {
    perfTimingCalc.blocks.push(_waterfall["default"].timeBlock("measure:" + measure.name, Math.round(measure.startTime), Math.round(measure.startTime + measure.duration), "block-custom-measure"));
  }); // tableLogger.logTables([
  // 	{name: "Navigation Timeline", data : perfTimingCalc.blocks, columns : ["name", "start", "end", "total"]},
  // 	{name: "Navigation Events", data : perfTimingCalc.output},
  // 	{name: "Marks", data : data.marks, columns : ["name", "startTime", "duration"]}
  // ]);


  return _waterfall["default"].setupTimeLine(0, Math.round(perfTimingCalc.pageLoadTime), perfTimingCalc.blocks, _data["default"].marks, [], "Navigation Timing");
};

var _default = navigationTimelineComponent;
exports["default"] = _default;


},{"../data":5,"../helpers/tableLogger":12,"../helpers/waterfall":13}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/*
Section to allow persistance of subset values
*/
var pageMetricComponent = {}; //init UI

pageMetricComponent.init = function () {};

var _default = pageMetricComponent;
exports["default"] = _default;


},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _data = _interopRequireDefault(require("../data"));

var _dom = _interopRequireDefault(require("../helpers/dom"));

var _waterfall = _interopRequireDefault(require("../helpers/waterfall"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ResourceTimelineComponent =
/*#__PURE__*/
function () {
  function ResourceTimelineComponent() {
    _classCallCheck(this, ResourceTimelineComponent);

    this.domain = "all";
    this.startTime = 0;
    this.endTime = null;
    this.markFrom = null;
    this.excludeDomainPattern = "";
    this.includeDomainPattern = "";
  }

  _createClass(ResourceTimelineComponent, [{
    key: "isPartial",
    value: function isPartial() {
      return !(this.startTime === 0 && this.endTime === null);
    }
  }, {
    key: "getChartData",
    value: function getChartData(filter) {
      var self = this;
      var calc = {
        pageLoadTime: _data["default"].perfTiming.loadEventEnd - _data["default"].perfTiming.responseStart,
        lastResponseEnd: _data["default"].perfTiming.loadEventEnd - _data["default"].perfTiming.responseStart
      };

      for (var perfProp in _data["default"].perfTiming) {
        if (_data["default"].perfTiming[perfProp] && typeof _data["default"].perfTiming[perfProp] === "number") {
          calc[perfProp] = _data["default"].perfTiming[perfProp] - _data["default"].perfTiming.navigationStart;
        }
      }

      var onDomLoad = _waterfall["default"].timeBlock("domContentLoaded Event", calc.domContentLoadedEventStart, calc.domContentLoadedEventEnd, "block-dom-content-loaded");

      var onLoadEvt = _waterfall["default"].timeBlock("Onload Event", calc.loadEventStart, calc.loadEventEnd, "block-onload");

      var navigationApiTotal = [_waterfall["default"].timeBlock("Unload", calc.unloadEventStart, calc.unloadEventEnd, "block-unload"), _waterfall["default"].timeBlock("Redirect", calc.redirectStart, calc.redirectEnd, "block-redirect"), _waterfall["default"].timeBlock("App cache", calc.fetchStart, calc.domainLookupStart, "block-appcache"), _waterfall["default"].timeBlock("DNS", calc.domainLookupStart, calc.domainLookupEnd, "block-dns"), _waterfall["default"].timeBlock("TCP", calc.connectStart, calc.connectEnd, "block-tcp"), _waterfall["default"].timeBlock("Timer to First Byte", calc.requestStart, calc.responseStart, "block-ttfb"), _waterfall["default"].timeBlock("Response", calc.responseStart, calc.responseEnd, "block-response"), _waterfall["default"].timeBlock("DOM Processing", calc.domLoading, calc.domComplete, "block-dom"), onDomLoad, onLoadEvt];

      if (calc.secureConnectionStart) {
        navigationApiTotal.push(_waterfall["default"].timeBlock("SSL", calc.secureConnectionStart, calc.connectEnd, "block-ssl"));
      }

      if (calc.msFirstPaint) {
        navigationApiTotal.push(_waterfall["default"].timeBlock("msFirstPaint Event", calc.msFirstPaint, calc.msFirstPaint, "block-ms-first-paint-event"));
      }

      if (calc.domInteractive) {
        navigationApiTotal.push(_waterfall["default"].timeBlock("domInteractive Event", calc.domInteractive, calc.domInteractive, "block-dom-interactive-event"));
      }

      if (!calc.redirectEnd && !calc.redirectStart && calc.fetchStart > calc.navigationStart) {
        navigationApiTotal.push(_waterfall["default"].timeBlock("Cross-Domain Redirect", calc.navigationStart, calc.fetchStart, "block-redirect"));
      }

      calc.blocks = self.isPartial() ? [] : [_waterfall["default"].timeBlock("Navigation API total", 0, calc.loadEventEnd, "block-navigation-api-total", navigationApiTotal)];

      _data["default"].allResourcesCalc.filter(function (resource) {
        //do not show items up to 20 seconds after onload - else beacon ping etc make diagram useless
        return resource.startTime < calc.loadEventEnd + 20000;
      }).filter(filter || function () {
        return true;
      }).forEach(function (resource, i) {
        var segments = [_waterfall["default"].timeBlock("Redirect", resource.redirectStart, resource.redirectEnd, "block-redirect"), _waterfall["default"].timeBlock("DNS Lookup", resource.domainLookupStart, resource.domainLookupEnd, "block-dns"), _waterfall["default"].timeBlock("Initial Connection (TCP)", resource.connectStart, resource.connectEnd, "block-dns"), _waterfall["default"].timeBlock("secureConnect", resource.secureConnectionStart || undefined, resource.connectEnd, "block-ssl"), _waterfall["default"].timeBlock("Timer to First Byte", resource.requestStart, resource.responseStart, "block-ttfb"), _waterfall["default"].timeBlock("Content Download", resource.responseStart || undefined, resource.responseEnd, "block-response")];
        var resourceTimings = [0, resource.redirectStart, resource.domainLookupStart, resource.connectStart, resource.secureConnectionStart, resource.requestStart, resource.responseStart];
        var firstTiming = resourceTimings.reduce(function (currMinTiming, currentValue) {
          if (currentValue > 0 && (currentValue < currMinTiming || currMinTiming <= 0) && currentValue != resource.startTime) {
            return currentValue;
          } else {
            return currMinTiming;
          }
        });

        if (resource.startTime < firstTiming) {
          segments.unshift(_waterfall["default"].timeBlock("Stalled/Blocking", resource.startTime, firstTiming, "block-blocking"));
        }

        calc.blocks.push(_waterfall["default"].timeBlock(resource.name, resource.startTime, resource.responseEnd, "block-" + resource.initiatorType, segments, resource));
        calc.lastResponseEnd = Math.max(calc.lastResponseEnd, resource.responseEnd);
      });

      var loadDuration = self.isPartial() ? Math.max((calc.blocks.map(function (it) {
        return it.end;
      }).reduce(function (r, v) {
        return Math.max(r, v);
      }, 1000) || self.startTime * 1000) - self.startTime * 1000, 1000) : Math.round(Math.max(calc.lastResponseEnd, _data["default"].perfTiming.loadEventEnd - _data["default"].perfTiming.navigationStart));
      return {
        loadDuration: loadDuration,
        blocks: calc.blocks,
        bg: [onDomLoad, onLoadEvt]
      };
    }
  }, {
    key: "refreshSVG",
    value: function refreshSVG(chartHolder) {
      var self = this;
      var startTimeInMs = self.startTime * 1000;
      var endTimeLimitInMs = self.endTime ? self.endTime * 1000 : null;
      var includeRegex = self.includeDomainPattern && self.includeDomainPattern.trim() !== "" ? new RegExp(self.includeDomainPattern) : null;
      var excludeRegex = self.excludeDomainPattern && self.excludeDomainPattern.trim() !== "" ? new RegExp(self.excludeDomainPattern) : null; // Resource filter

      var chartData = self.getChartData(function (resource) {
        return (self.domain === "all" || resource.domain === self.domain) && resource.startTime >= startTimeInMs && (!endTimeLimitInMs || resource.startTime <= endTimeLimitInMs) && (!includeRegex || includeRegex.exec(resource.name)) && (!excludeRegex || !excludeRegex.exec(resource.name));
      });
      var endTimeInMs = startTimeInMs + chartData.loadDuration;

      var tempChartHolder = _waterfall["default"].setupTimeLine(self.startTime, chartData.loadDuration, chartData.blocks, // Mark filter
      _data["default"].marks.filter(function (it) {
        return it.startTime >= startTimeInMs && it.startTime <= endTimeInMs && (!self.markFrom || it.startTime >= self.markFrom * 1000);
      }), chartData.bg, "Temp");

      var oldSVG = chartHolder.getElementsByClassName("water-fall-chart")[0];
      var newSVG = tempChartHolder.getElementsByClassName("water-fall-chart")[0];
      chartHolder.replaceChild(newSVG, oldSVG);
    }
  }, {
    key: "init",
    value: function init() {
      var self = this;
      var chartData = self.getChartData();

      var chartHolder = _waterfall["default"].setupTimeLine(self.startTime, chartData.loadDuration, chartData.blocks, _data["default"].marks, chartData.bg, "Resource Timing");

      var chartSvg = chartHolder.getElementsByClassName("water-fall-chart")[0]; // Add exclude pattern editor

      var excludeDomainPatternEditor = _dom["default"].newTag("textarea", {
        "class": "exclude-pattern-editor",
        placeholder: "Exclude pattern",
        onblur: function onblur(e) {
          var time = e.target.value;
          self.excludeDomainPattern = e.target.value.trim() || "";
          self.refreshSVG(chartHolder);
        }
      });

      chartSvg.parentNode.insertBefore(excludeDomainPatternEditor, chartSvg); // Add exclude pattern editor

      var includeDomainPatternEditor = _dom["default"].newTag("textarea", {
        "class": "include-pattern-editor",
        placeholder: "Include pattern",
        onblur: function onblur(e) {
          var time = e.target.value;
          self.includeDomainPattern = e.target.value.trim() || "";
          self.refreshSVG(chartHolder);
        }
      });

      chartSvg.parentNode.insertBefore(includeDomainPatternEditor, chartSvg); // Add mark from selector

      var markFromSelector = _dom["default"].newTag("select", {
        "class": "mark-from-selector",
        onchange: function onchange(e) {
          var time = e.target.options[e.target.selectedIndex].value;
          self.markFrom = time !== "all" ? parseInt(time) : null;
          self.refreshSVG(chartHolder);
        }
      });

      markFromSelector.appendChild(_dom["default"].newTag("option", {
        text: "Mark From",
        value: "all"
      }));

      for (var i = 1; i <= 25; i++) {
        markFromSelector.appendChild(_dom["default"].newTag("option", {
          text: i
        }));
      }

      chartSvg.parentNode.insertBefore(markFromSelector, chartSvg); // Add end time selector

      var endTimeSelector = _dom["default"].newTag("select", {
        "class": "end-time-selector",
        onchange: function onchange(e) {
          var time = e.target.options[e.target.selectedIndex].value;
          self.endTime = time !== "all" ? parseInt(time) : null;
          self.refreshSVG(chartHolder);
        }
      });

      endTimeSelector.appendChild(_dom["default"].newTag("option", {
        text: "To",
        value: "all"
      }));

      for (var _i = 1; _i <= 25; _i++) {
        endTimeSelector.appendChild(_dom["default"].newTag("option", {
          text: _i
        }));
      }

      chartSvg.parentNode.insertBefore(endTimeSelector, chartSvg); // Add start time selector

      var startTimeSelector = _dom["default"].newTag("select", {
        "class": "start-time-selector",
        onchange: function onchange(e) {
          var time = e.target.options[e.target.selectedIndex].value;
          self.startTime = time ? parseInt(time) : 0;
          self.refreshSVG(chartHolder);
        }
      });

      startTimeSelector.appendChild(_dom["default"].newTag("option", {
        text: "From",
        value: "0"
      }));

      for (var _i2 = 1; _i2 <= 20; _i2++) {
        startTimeSelector.appendChild(_dom["default"].newTag("option", {
          text: _i2
        }));
      }

      chartSvg.parentNode.insertBefore(startTimeSelector, chartSvg); // Domain selector

      if (_data["default"].requestsByDomain.length > 1) {
        var selectBox = _dom["default"].newTag("select", {
          "class": "domain-selector",
          onchange: function onchange(e) {
            self.domain = e.target.options[e.target.selectedIndex].value;
            self.refreshSVG(chartHolder);
          }
        });

        selectBox.appendChild(_dom["default"].newTag("option", {
          text: "show all",
          value: "all"
        }));

        _data["default"].requestsByDomain.forEach(function (domain) {
          selectBox.appendChild(_dom["default"].newTag("option", {
            text: domain.domain
          }));
        });

        chartSvg.parentNode.insertBefore(selectBox, chartSvg);
      }

      return chartHolder;
    }
  }]);

  return ResourceTimelineComponent;
}();

var _default = ResourceTimelineComponent;
exports["default"] = _default;


},{"../data":5,"../helpers/dom":6,"../helpers/waterfall":13}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _helpers = _interopRequireDefault(require("./helpers/helpers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _isValid = true;
var data = {
  resources: [],
  marks: [],
  measures: [],
  perfTiming: [],
  allResourcesCalc: [],
  isValid: function isValid() {
    return _isValid;
  }
};

var supportsFeatures = function supportsFeatures() {
  //Check if the browser suppots the timing APIs
  if (window.performance && window.performance.getEntriesByType !== undefined) {
    data.resources = window.performance.getEntriesByType("resource");
    data.marks = window.performance.getEntriesByType("mark");
    data.measures = window.performance.getEntriesByType("measure");
  } else if (window.performance && window.performance.webkitGetEntriesByType !== undefined) {
    data.resources = window.performance.webkitGetEntriesByType("resource");
    data.marks = window.performance.webkitGetEntriesByType("mark");
    data.measures = window.performance.webkitGetEntriesByType("measure");
  } else {
    alert("Oups, looks like this browser does not support the Resource Timing API\ncheck http://caniuse.com/#feat=resource-timing to see the ones supporting it \n\n");
    return false;
  }

  if (window.performance.timing) {
    data.perfTiming = window.performance.timing;
  } else {
    alert("Oups, looks like this browser does not support performance timing");
    return false;
  }

  if (data.perfTiming.loadEventEnd - data.perfTiming.navigationStart < 0) {
    alert("Page is still loading - please try again when page is loaded.");
    return false;
  }

  return true;
};

(function () {
  _isValid = supportsFeatures();
  data.allResourcesCalc = data.resources //remove this bookmarklet from the result
  .filter(function (currR) {
    return !currR.name.match(/http[s]?\:\/\/(micmro|nurun).github.io\/performance-bookmarklet\/.*/);
  }).map(function (currR, i, arr) {
    //crunch the resources data into something easier to work with
    var isRequest = currR.name.indexOf("http") === 0;
    var urlFragments, maybeFileName, fileExtension;

    if (isRequest) {
      urlFragments = currR.name.match(/:\/\/(.[^/]+)([^?]*)\??(.*)/);
      maybeFileName = urlFragments[2].split("/").pop();
      fileExtension = maybeFileName.substr((Math.max(0, maybeFileName.lastIndexOf(".")) || Infinity) + 1);
    } else {
      urlFragments = ["", location.host];
      fileExtension = currR.name.split(":")[0];
    }

    var currRes = {
      name: currR.name,
      domain: urlFragments[1],
      initiatorType: currR.initiatorType || fileExtension || "SourceMap or Not Defined",
      fileExtension: fileExtension || "XHR or Not Defined",
      loadtime: currR.duration,
      fileType: _helpers["default"].getFileType(fileExtension, currR.initiatorType),
      isRequestToHost: urlFragments[1] === location.host
    };

    for (var attr in currR) {
      if (typeof currR[attr] !== "function") {
        currRes[attr] = currR[attr];
      }
    }

    if (currR.requestStart) {
      currRes.requestStartDelay = currR.requestStart - currR.startTime;
      currRes.dns = currR.domainLookupEnd - currR.domainLookupStart;
      currRes.tcp = currR.connectEnd - currR.connectStart;
      currRes.ttfb = currR.responseStart - currR.startTime;
      currRes.requestDuration = currR.responseStart - currR.requestStart;
    }

    if (currR.secureConnectionStart) {
      currRes.ssl = currR.connectEnd - currR.secureConnectionStart;
    }

    return currRes;
  }); //filter out non-http[s] and sourcemaps

  data.requestsOnly = data.allResourcesCalc.filter(function (currR) {
    return currR.name.indexOf("http") === 0 && !currR.name.match(/js.map$/);
  }); //get counts

  data.initiatorTypeCounts = _helpers["default"].getItemCount(data.requestsOnly.map(function (currR, i, arr) {
    return currR.initiatorType || currR.fileExtension;
  }), "initiatorType");
  data.initiatorTypeCountHostExt = _helpers["default"].getItemCount(data.requestsOnly.map(function (currR, i, arr) {
    return (currR.initiatorType || currR.fileExtension) + " " + (currR.isRequestToHost ? "(host)" : "(external)");
  }), "initiatorType");
  data.requestsByDomain = _helpers["default"].getItemCount(data.requestsOnly.map(function (currR, i, arr) {
    return currR.domain;
  }), "domain");
  data.fileTypeCountHostExt = _helpers["default"].getItemCount(data.requestsOnly.map(function (currR, i, arr) {
    return currR.fileType + " " + (currR.isRequestToHost ? "(host)" : "(external)");
  }), "fileType");
  data.fileTypeCounts = _helpers["default"].getItemCount(data.requestsOnly.map(function (currR, i, arr) {
    return currR.fileType;
  }), "fileType");
  var tempResponseEnd = {}; //TODO: make immutable

  data.requestsOnly.forEach(function (currR) {
    var entry = data.requestsByDomain.filter(function (a) {
      return a.domain == currR.domain;
    })[0] || {};
    var lastResponseEnd = tempResponseEnd[currR.domain] || 0;
    currR.duration = entry.duration || currR.responseEnd - currR.startTime;

    if (lastResponseEnd <= currR.startTime) {
      entry.durationTotalParallel = (entry.durationTotalParallel || 0) + currR.duration;
    } else if (lastResponseEnd < currR.responseEnd) {
      entry.durationTotalParallel = (entry.durationTotalParallel || 0) + (currR.responseEnd - lastResponseEnd);
    }

    tempResponseEnd[currR.domain] = currR.responseEnd || 0;
    entry.durationTotal = (entry.durationTotal || 0) + currR.duration;
  }); //Request counts

  data.hostRequests = data.requestsOnly.filter(function (domain) {
    return domain.domain === location.host;
  }).length;
  data.currAndSubdomainRequests = data.requestsOnly.filter(function (domain) {
    return domain.domain.split(".").slice(-2).join(".") === location.host.split(".").slice(-2).join(".");
  }).length;
  data.crossDocDomainRequests = data.requestsOnly.filter(function (domain) {
    return !_helpers["default"].endsWith(domain.domain, document.domain);
  }).length;
  data.hostSubdomains = data.requestsByDomain.filter(function (domain) {
    return _helpers["default"].endsWith(domain.domain, location.host.split(".").slice(-2).join(".")) && domain.domain !== location.host;
  }).length;
  data.slowestCalls = [];
  data.average = undefined;

  if (data.allResourcesCalc.length > 0) {
    data.slowestCalls = data.allResourcesCalc.filter(function (a) {
      return a.name !== location.href;
    }).sort(function (a, b) {
      return b.duration - a.duration;
    });
    data.average = Math.floor(data.slowestCalls.reduceRight(function (a, b) {
      if (typeof a !== "number") {
        return a.duration + b.duration;
      }

      return a + b.duration;
    }) / data.slowestCalls.length);
  }
})();

var _default = data;
exports["default"] = _default;


},{"./helpers/helpers":7}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
DOM Helpers
*/

/**
 * @param  {string} text
 * @returns {Text}
 */
var newTextNode = function newTextNode(text) {
  return document.createTextNode(text);
};
/**
 * creats a html tag
 *
 * @param  {string} tagName
 * @param  {Object} settings
 * @param  {string} css
 * @return {HTMLElement} new HTMLElement tag
 */


var newTag = function newTag(tagName, settings, css) {
  settings = settings || {};
  var tag = document.createElement(tagName);

  for (var attr in settings) {
    if (attr != "text") {
      tag[attr] = settings[attr];
    }
  }

  if (settings.text) {
    tag.textContent = settings.text;
  } else if (settings.childElement) {
    if (_typeof(settings.childElement) === "object") {
      //if childNodes NodeList is passed in
      if (settings.childElement instanceof NodeList) {
        //NodeList is does not inherit from array
        Array.prototype.slice.call(settings.childElement, 0).forEach(function (childNode) {
          tag.appendChild(childNode);
        });
      } else {
        tag.appendChild(settings.childElement);
      }
    } else {
      tag.appendChild(newTextNode(settings.childElement));
    }
  }

  if (settings["class"]) {
    tag.className = settings["class"];
  }

  tag.style.cssText = css || "";
  return tag;
};
/**
 * Helper to create a table
 *
 * @param  {string} id - id of holder
 * @param  {function} headerBuilder
 * @param  {function} rowBuilder
 * @returns {HTMLDivElement} `table` wrapped in a holder `div`
 */


var tableFactory = function tableFactory(id, headerBuilder, rowBuilder) {
  var tableHolder = newTag("div", {
    id: id || "",
    "class": "table-holder"
  });
  var table = newTag("table");
  var thead = newTag("thead");
  thead.appendChild(headerBuilder(newTag("tr")));
  table.appendChild(thead);
  table.appendChild(rowBuilder(newTag("tbody")));
  tableHolder.appendChild(table);
  return tableHolder;
};
/**
 * Combines 2 nodes into a wrapper `div`
 *
 * @param  {Element|string} a - fist node
 * @param  {Element|string} b - second node
 * @returns {HTMLDivElement}
 */


var combineNodes = function combineNodes(a, b) {
  var wrapper = document.createElement("div");

  if (_typeof(a) === "object") {
    wrapper.appendChild(a);
  } else if (typeof a === "string") {
    wrapper.appendChild(newTextNode(a));
  }

  if (_typeof(b) === "object") {
    wrapper.appendChild(b);
  } else if (typeof b === "string") {
    wrapper.appendChild(newTextNode(b));
  }

  return wrapper.childNodes;
};
/**
 * Adds CSS classname to `el`
 *
 * @param  {HTMLElement} el
 * @param  {string} className
 * @returns {HTMLElement} returns `el` again for chaining
 */


var addClass = function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    // IE doesn't support classList in SVG - also no need for dublication check i.t.m.
    el.setAttribute("class", el.getAttribute("class") + " " + className);
  }

  return el;
};
/**
 * Removes CSS classname from `el`
 *
 * @param  {HTMLElement} el
 * @param  {string} className
 * @returns {HTMLElement} returns `el` again for chaining
 */


var removeClass = function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    //IE doesn't support classList in SVG - also no need for dublication check i.t.m.
    el.setAttribute("class", el.getAttribute("class").replace(new RegExp("(\\s|^)" + className + "(\\s|$)", "g"), "$2"));
  }

  return el;
};

var _default = {
  newTextNode: newTextNode,
  newTag: newTag,
  tableFactory: tableFactory,
  combineNodes: combineNodes,
  addClass: addClass,
  removeClass: removeClass
};
exports["default"] = _default;


},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
Misc helpers
*/
var helper = {}; //extract a resources file type

helper.getFileType = function (fileExtension, initiatorType) {
  if (fileExtension) {
    switch (fileExtension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "svg":
      case "ico":
        return "image";

      case "js":
        return "js";

      case "css":
        return "css";

      case "html":
        return "html";

      case "woff":
      case "woff2":
      case "ttf":
      case "eot":
      case "otf":
        return "font";

      case "swf":
        return "flash";

      case "map":
        return "source-map";
    }
  }

  if (initiatorType) {
    switch (initiatorType) {
      case "xmlhttprequest":
        return "ajax";

      case "img":
        return "image";

      case "script":
        return "js";

      case "internal":
      case "iframe":
        return "html";
      //actual page

      default:
        return "other";
    }
  }

  return initiatorType;
};

helper.getRandomColor = function (baseRangeRed, baseRangeGreen, baseRangeBlue) {
  var range = [baseRangeRed || "0123456789ABCDEF", baseRangeGreen || "0123456789ABCDEF", baseRangeBlue || "0123456789ABCDEF"];
  var color = "#",
      r = 0;

  for (var i = 0; i < 6; i++) {
    r = Math.floor(i / 2);
    color += range[r].split("")[Math.floor(Math.random() * range[r].length)];
  }

  return color;
};

helper.endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

var getColourVariation = function getColourVariation(hexColour, variation) {
  var r = (parseInt(hexColour.substr(1, 2), 16) + variation).toString(16),
      g = (parseInt(hexColour.substr(3, 2), 16) + variation).toString(16),
      b = (parseInt(hexColour.substr(5, 2), 16) + variation).toString(16);
  return "#" + r + g + b;
};

helper.getInitiatorOrFileTypeColour = function (initiatorOrFileType, fallbackColour, variation) {
  var colour = fallbackColour || "#bebebe"; //default
  //colour the resources by initiator or file type

  switch (initiatorOrFileType) {
    case "css":
      colour = "#afd899";
      break;

    case "iframe":
    case "html":
      colour = "#85b3f2";
      break;

    case "img":
    case "image":
      colour = "#bc9dd6";
      break;

    case "script":
    case "js":
      colour = "#e7bd8c";
      break;

    case "link":
      colour = "#89afe6";
      break;

    case "swf":
      colour = "#4db3ba";
      break;

    case "font":
      colour = "#e96859";
      break;
    //TODO check if this works

    case "xmlhttprequest":
    case "ajax":
      colour = "#e7d98c";
      break;
  }

  if (variation === true) {
    return getColourVariation(colour, -5);
  }

  return colour;
}; //counts occurrences of items in array arr and returns them as array of key valure pairs
//keyName overwrites the name of the key attribute


helper.getItemCount = function (arr, keyName) {
  var counts = {},
      resultArr = [],
      obj;
  arr.forEach(function (key) {
    counts[key] = counts[key] ? counts[key] + 1 : 1;
  }); //pivot data

  for (var fe in counts) {
    obj = {};
    obj[keyName || "key"] = fe;
    obj.count = counts[fe];
    resultArr.push(obj);
  }

  return resultArr.sort(function (a, b) {
    return a.count < b.count ? 1 : -1;
  });
};

helper.clone = function (obj) {
  var copy; // Handle the 3 simple types, and null or undefined

  if (null == obj || "object" != _typeof(obj)) return obj; // Handle Date

  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  } // Handle Array


  if (obj instanceof Array) {
    copy = [];

    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = helper.clone(obj[i]);
    }

    return copy;
  } // Handle Object


  if (obj instanceof Object) {
    copy = {};

    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = helper.clone(obj[attr]);
    }

    return copy;
  }

  throw new Error("Unable to helper.clone obj");
};

var _default = helper;
exports["default"] = _default;


},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _dom = _interopRequireDefault(require("../helpers/dom"));

var _style = require("../helpers/style");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
iFrame and holder logic
*/

/**
 * iFrame to contain perf-bookmarklet's diagrams
 * @type {HTMLIFrameElement}
 */
var iFrameEl;
/**
 * Holder element
 * @type {HTMLDivElement}
 */

var outputHolder;
/** @type {HTMLDivElement}  */

var outputContent;
/**
 * Holder document for perf-bookmarklet (in iFrame)
 * @type {Document}
 */

var outputIFrame;
/** setup iFrame overlay */

var initHolderEl = function initHolderEl() {
  // find or create holder element
  if (!outputHolder) {
    outputHolder = _dom["default"].newTag("div", {
      id: "perfbook-holder"
    });
    outputContent = _dom["default"].newTag("div", {
      id: "perfbook-content"
    });
    window.outputContent;

    var closeBtn = _dom["default"].newTag("button", {
      "class": "perfbook-close",
      text: "close"
    });

    closeBtn.addEventListener("click", function () {
      iFrameEl.parentNode.removeChild(iFrameEl);
    });
    outputHolder.appendChild(closeBtn);
    outputHolder.appendChild(outputContent);
  } else {
    outputContent = outputIFrame.getElementById("perfbook-content"); //clear existing data

    while (outputContent.firstChild) {
      outputContent.removeChild(outputContent.firstChild);
    }
  }
};

var addComponent = function addComponent(domEl) {
  if (domEl) {
    outputContent.appendChild(domEl);
  }
};

var getOutputIFrame = function getOutputIFrame() {
  return outputIFrame;
};

var _default = {
  /**
   * @param  {function} onIFrameReady
   */
  setup: function setup(onIFrameReady) {
    iFrameEl = document.getElementById("perfbook-iframe");

    var finalize = function finalize() {
      initHolderEl();
      onIFrameReady(addComponent);
      outputIFrame.body.appendChild(outputHolder);

      if (getComputedStyle(document.body).overflow != "hidden") {
        iFrameEl.style.height = outputHolder.clientHeight + 36 + "px";
      } else {
        iFrameEl.style.height = "100%";
      }
    };

    if (iFrameEl) {
      outputIFrame = iFrameEl.contentWindow.document;
      outputHolder = outputIFrame.getElementById("perfbook-holder");
      initHolderEl();
      onIFrameReady(addComponent);
      finalize();
    } else {
      iFrameEl = _dom["default"].newTag("iframe", {
        id: "perfbook-iframe",
        onload: function onload() {
          outputIFrame = iFrameEl.contentWindow.document; //add style to iFrame

          var styleTag = _dom["default"].newTag("style", {
            type: "text/css",
            text: _style.style
          });

          outputIFrame.head.appendChild(styleTag);
          finalize();
        }
      }, "position:absolute; top:1%; right:1%; margin-bottom:1em; left:1%; z-index:6543210; width:98%; border:0; box-shadow:0 0 25px 0 rgba(0,0,0,0.5); background:#fff;");
      document.body.appendChild(iFrameEl);
    }
  },
  getOutputIFrame: getOutputIFrame
};
exports["default"] = _default;


},{"../helpers/dom":6,"../helpers/style":10}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
// Do not add to Chrome Extension
var _default = {};
exports["default"] = _default;


},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.style = void 0;
var style = "body {overflow: auto; background: #fff; font:normal 12px/18px sans-serif; color:#333;} * {box-sizing:border-box;} svg {font:normal 12px/18px sans-serif;} th {text-align: left;} button {cursor:pointer;} button:disabled {cursor:default;} #perfbook-holder {overflow: hidden; width:100%; padding:1em 2em;} #perfbook-content {position:relative;} .perfbook-close {position:absolute; top:0; right:0; padding:1em; z-index:1; background:transparent; border:0; cursor:pointer;} .full-width {width:100%;} .chart-holder {margin: 5em 0;} h1 {font:bold 18px/18px sans-serif; margin:1em 0; color:#666;} .text-right {text-align: right;} .text-left {text-align: left;} .css {background: #afd899;} .iframe, .html, .internal {background: #85b3f2;} .img, .image {background: #bc9dd6;} .script, .js {background: #e7bd8c;} .link {background: #89afe6;} .swf, .flash {background: #4db3ba;} .font {background: #e96859;} .xmlhttprequest, .ajax {background: #e7d98c;} .other {background: #bebebe;} .css-light {background: #b9cfa0;} .iframe-light, .html-light, .internal-light {background: #c2d9f9;} .img-light, .image-light {background: #deceeb;} .script-light, .js-light {background: #f3dec6;} .link-light {background: #c4d7f3;} .swf-light, .flash-light {background: #a6d9dd;} .font-light {background: #f4b4ac;} .xmlhttprequest-light, .ajax-light {background: #f3ecc6;} .other-light {background: #dfdfdf;} .block-css {fill: #afd899;} .block-iframe, .block-html, .block-internal {fill: #85b3f2;} .block-img, .block-image {fill: #bc9dd6;} .block-script, .block-js {fill: #e7bd8c;} .block-link {fill: #89afe6;} .block-swf, .block-flash {fill: #4db3ba;} .block-font {fill: #e96859;} .block-xmlhttprequest, .block-ajax {fill: #e7d98c;} .block-other {fill: #bebebe;} .block-total {fill: #ccc;} .block-unload {fill: #909;} .block-redirect {fill: #ffff60;} .block-appcache {fill: #1f831f;} .block-dns {fill: #1f7c83;} .block-tcp {fill: #e58226;} .block-ttfb {fill: #1fe11f;} .block-response {fill: #1977dd;} .block-dom {fill: #9cc;} .block-dom-content-loaded {fill: #d888df;} .block-onload {fill: #c0c0ff;} .block-ssl {fill: #c141cd; } .block-ms-first-paint-event {fill: #8fbc83; } .block-dom-interactive-event {fill: #d888df; } .block-network-server {fill: #8cd18c; } .block-custom-measure {fill: #f00; } .block-navigation-api-total {fill: #ccc;} .block-blocking {fill: #cdcdcd;} .block-undefined {fill: #0f0;} .tiles-holder {margin: 2em -18px 2em 0; display: -webkit-box; display: -moz-box; display: -ms-flexbox; display: -webkit-flex; display: flex; -webkit-flex-flow: row wrap; flex-flow: row wrap; } .summary-tile { flex-grow: 1; width:250px; background:#ddd; padding: 1em; margin:0 18px 1em 0; color:#666; text-align:center;} .summary-tile dt {font-weight:bold; font-size:16px; display:block; line-height:1.2em; min-height:2.9em; padding:0 0 0.5em;} .summary-tile dd {font-weight:bold; line-height:60px; margin:0;} .summary-tile-appendix {float:left; clear:both; width:100%; font-size:10px; line-height:1.1em; color:#666;} .summary-tile-appendix dt {float:left; clear:both;} .summary-tile-appendix dd {float:left; margin:0 0 0 1em;} .pie-charts-holder {margin-right: -72px; display: -webkit-box; display: -moz-box; display: -ms-flexbox; display: -webkit-flex; display: flex; -webkit-flex-flow: row wrap; flex-flow: row wrap;} .pie-chart-holder {flex-grow: 1; width:350px; max-width: 600px; margin: 0 72px 0 0;} .pie-chart-holder h1 {min-height:2em;} .pie-chart {width:100%;} .table-holder {overflow-x:auto} .table-holder table {float:left; width:100%; font-size:12px; line-height:18px;} .table-holder th, .table-holder td {line-height: 1em; margin:0; padding:0.25em 0.5em 0.25em 0;} #pie-request-by-domain {flex-grow: 2; width:772px; max-width: 1272px;} #filetypes-and-intiators-table {margin: 2em 0 5em;} #filetypes-and-intiators-table table {vertical-align: middle; border-collapse: collapse;} #filetypes-and-intiators-table td {padding:0.5em; border-right: solid 1px #fff;} #filetypes-and-intiators-table td:last-child {padding-right: 0; border-right:0;} #filetypes-and-intiators-table .file-type-row td {border-top: solid 10px #fff;} #filetypes-and-intiators-table .file-type-row:first-child td {border-top: none;} .water-fall-holder {fill:#ccc;} .water-fall-chart {width:100%; background:#f0f5f0;} .water-fall-chart .marker-holder {width:100%;} .water-fall-chart .line-holder {stroke-width:1; stroke: #ccc; stroke-opacity:0.5;} .water-fall-chart .line-holder.active {stroke: #69009e; stroke-width:2; stroke-opacity:1;} .water-fall-chart .labels {width:100%;} .water-fall-chart .labels .inner-label {pointer-events: none;} .water-fall-chart .time-block.active {opacity: 0.8;} .water-fall-chart .line-end, .water-fall-chart .line-start {display: none; stroke-width:1; stroke-opacity:0.5; stroke: #000;} .water-fall-chart .line-end.active, .water-fall-chart .line-start.active {display: block;} .water-fall-chart .mark-holder text {-webkit-writing-mode: tb; writing-mode:vertical-lr; writing-mode: tb;} .time-scale line {stroke:#0cc; stroke-width:1;} .time-scale text {font-weight:bold;} .domain-selector, .start-time-selector, .end-time-selector, .exclude-pattern-editor, .include-pattern-editor, .mark-from-selector { float:right; } .exclude-pattern-editor, .include-pattern-editor { width: 150px; word-break: break-all; } .navigation-timing {} .legends-group { display: -webkit-box; display: -moz-box; display: -ms-flexbox; display: -webkit-flex; display: flex; -webkit-flex-flow: row wrap; flex-flow: row wrap; } .legends-group .legend-holder { flex-grow: 1; width:250px; padding:0 1em 1em; } .legends-group .legend-holder h4 { margin: 0; padding: 0; } .legend dt {float: left; clear: left; padding: 0 0 0.5em;} .legend dd {float: left; display: inline-block; margin: 0 1em; line-height: 1em;} .legend .colorBoxHolder span {display: inline-block; width: 15px; height: 1em;} .page-metric {} .page-metric button {margin-left: 2em;}";
exports.style = style;


},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _iFrameHolder = _interopRequireDefault(require("../helpers/iFrameHolder"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
SVG Helpers
*/

/**
 * Create new SVG element
 *
 * @param  {string} tagName
 * @param  {Object} settings
 * @param  {string} css
 */
var newEl = function newEl(tagName, settings, css) {
  var el = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  settings = settings || {};

  for (var attr in settings) {
    if (attr != "text") {
      el.setAttributeNS(null, attr, settings[attr]);
    }
  }

  el.textContent = settings.text || "";
  el.style.cssText = css || "";
  return el;
};
/**
 * Creates a new SVG `text` element
 *
 * @param  {string} text
 * @param  {number} y
 * @param  {string} css
 * @returns {SVGTextElement}
 */


var newTextEl = function newTextEl(text, y, css) {
  return newEl("text", {
    fill: "#111",
    y: y,
    text: text
  }, (css || "") + " text-shadow:0 0 4px #fff;");
};
/**
 * Calculates the with of a SVG `text` element
 *
 * _needs access to iFrame, since width depends on context_
 *
 * @param  {SVGTextElement} textNode
 * @returns {number} width of `textNode`
 */


var getNodeTextWidth = function getNodeTextWidth(textNode) {
  var tmp = newEl("svg:svg", {}, "visibility:hidden;");
  tmp.appendChild(textNode);

  _iFrameHolder["default"].getOutputIFrame().body.appendChild(tmp);

  var nodeWidth = textNode.getBBox().width;
  tmp.parentNode.removeChild(tmp);
  return nodeWidth;
};

var _default = {
  newEl: newEl,
  newTextEl: newTextEl,
  getNodeTextWidth: getNodeTextWidth
};
exports["default"] = _default;


},{"../helpers/iFrameHolder":8}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/*
Log tables in console
*/
var tableLogger = {};

tableLogger.logTable = function (table) {
  debugger;

  if (table.data.length > 0 && console.table) {
    console.log("\n\n\n" + table.name + ":");
    console.table(table.data, table.columns);
  }
};

tableLogger.logTables = function (tableArr) {
  tableArr.forEach(tableLogger.logTable);
};

var _default = tableLogger;
exports["default"] = _default;


},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _svg = _interopRequireDefault(require("../helpers/svg"));

var _dom = _interopRequireDefault(require("../helpers/dom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
Helper to create waterfall timelines
*/
var waterfall = {}; //model for block and segment

waterfall.timeBlock = function (name, start, end, cssClass, segments, rawResource) {
  return {
    name: name,
    start: start,
    end: end,
    total: typeof start !== "number" || typeof end !== "number" ? undefined : end - start,
    cssClass: cssClass,
    segments: segments,
    rawResource: rawResource
  };
};

waterfall.setupTimeLine = function (startTimeAdjustment, durationMs, blocks, marks, lines, title) {
  var startTimeAdjustmentInMs = startTimeAdjustment * 1000;
  var unit = durationMs / 100,
      barsToShow = blocks.filter(function (block) {
    return typeof block.start == "number" && typeof block.total == "number";
  }).sort(function (a, b) {
    return (a.start || 0) - (b.start || 0);
  }),
      maxMarkTextLength = marks.length > 0 ? marks.reduce(function (currMax, currValue) {
    return Math.max(typeof currMax == "number" ? currMax : 0, _svg["default"].getNodeTextWidth(_svg["default"].newTextEl(currValue.name, "0")));
  }) : 0,
      diagramHeight = (barsToShow.length + 1) * 25,
      chartHolderHeight = diagramHeight + maxMarkTextLength + 100;

  var chartHolder = _dom["default"].newTag("section", {
    "class": "resource-timing water-fall-holder chart-holder"
  });

  var timeLineHolder = _svg["default"].newEl("svg:svg", {
    height: Math.floor(chartHolderHeight),
    "class": "water-fall-chart"
  });

  var timeLineLabelHolder = _svg["default"].newEl("g", {
    "class": "labels"
  });

  var endLine = _svg["default"].newEl("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: diagramHeight,
    "class": "line-end"
  });

  var startLine = _svg["default"].newEl("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: diagramHeight,
    "class": "line-start"
  });

  var onRectMouseEnter = function onRectMouseEnter(evt) {
    var targetRect = evt.target;

    _dom["default"].addClass(targetRect, "active");

    var xPosEnd = targetRect.x.baseVal.valueInSpecifiedUnits + targetRect.width.baseVal.valueInSpecifiedUnits + "%";
    var xPosStart = targetRect.x.baseVal.valueInSpecifiedUnits + "%";
    endLine.x1.baseVal.valueAsString = xPosEnd;
    endLine.x2.baseVal.valueAsString = xPosEnd;
    startLine.x1.baseVal.valueAsString = xPosStart;
    startLine.x2.baseVal.valueAsString = xPosStart;

    _dom["default"].addClass(endLine, "active");

    _dom["default"].addClass(startLine, "active");

    targetRect.parentNode.appendChild(endLine);
    targetRect.parentNode.appendChild(startLine);
  };

  var onRectMouseLeave = function onRectMouseLeave(evt) {
    _dom["default"].removeClass(evt.target, "active");

    _dom["default"].removeClass(endLine, "active");

    _dom["default"].removeClass(startLine, "active");
  };

  var createRect = function createRect(width, height, x, y, cssClass, label, segments) {
    var rectHolder;

    var rect = _svg["default"].newEl("rect", {
      width: width / unit + "%",
      height: height - 1,
      x: Math.round(x / unit * 100) / 100 + "%",
      y: y,
      "class": (segments && segments.length > 0 ? "time-block" : "segment") + " " + (cssClass || "block-undefined")
    });

    if (label) {
      rect.appendChild(_svg["default"].newEl("title", {
        text: label
      })); // Add tile to wedge path
    }

    rect.addEventListener("mouseenter", onRectMouseEnter);
    rect.addEventListener("mouseleave", onRectMouseLeave);

    if (segments && segments.length > 0) {
      rectHolder = _svg["default"].newEl("g");
      rectHolder.appendChild(rect);
      segments.forEach(function (segment) {
        if (segment.total > 0 && typeof segment.start === "number") {
          rectHolder.appendChild(createRect(segment.total, 8, segment.start ? segment.start - startTimeAdjustmentInMs : 0.001, y, segment.cssClass, segment.name + " (" + Math.round(segment.start) + "ms - " + Math.round(segment.end) + "ms | total: " + Math.round(segment.total) + "ms)"));
        }
      });
      return rectHolder;
    } else {
      return rect;
    }
  };

  var createBgRect = function createBgRect(block) {
    var rect = _svg["default"].newEl("rect", {
      width: (block.total || 1) / unit + "%",
      height: diagramHeight,
      x: (block.start || 0.001) / unit + "%",
      y: 0,
      "class": block.cssClass || "block-undefined"
    });

    rect.appendChild(_svg["default"].newEl("title", {
      text: block.name
    })); // Add tile to wedge path

    return rect;
  };

  var createTimeWrapper = function createTimeWrapper() {
    var timeHolder = _svg["default"].newEl("g", {
      "class": "time-scale full-width"
    });

    for (var i = 0, secs = durationMs / 1000, secPerc = 100 / secs; i <= secs; i++) {
      var lineLabel = _svg["default"].newTextEl(i + startTimeAdjustment + "sec", diagramHeight);

      if (i > secs - 0.2) {
        lineLabel.setAttribute("x", secPerc * i - 0.5 + "%");
        lineLabel.setAttribute("text-anchor", "end");
      } else {
        lineLabel.setAttribute("x", secPerc * i + 0.5 + "%");
      }

      var lineEl = _svg["default"].newEl("line", {
        x1: secPerc * i + "%",
        y1: "0",
        x2: secPerc * i + "%",
        y2: diagramHeight
      });

      timeHolder.appendChild(lineEl);
      timeHolder.appendChild(lineLabel);
    }

    return timeHolder;
  };

  var renderMarks = function renderMarks() {
    var marksHolder = _svg["default"].newEl("g", {
      transform: "scale(1, 1)",
      "class": "marker-holder"
    });

    marks.forEach(function (mark, i) {
      var x = (mark.startTime - startTimeAdjustmentInMs) / unit;

      var markHolder = _svg["default"].newEl("g", {
        "class": "mark-holder"
      });

      var lineHolder = _svg["default"].newEl("g", {
        "class": "line-holder"
      });

      var lineLabelHolder = _svg["default"].newEl("g", {
        "class": "line-label-holder",
        x: x + "%"
      });

      mark.x = x;

      var lineLabel = _svg["default"].newTextEl(mark.name + " ::::: (" + Math.round(mark.startTime) + "ms)", diagramHeight + 25); //lineLabel.setAttribute("writing-mode", "tb");


      lineLabel.setAttribute("x", x + "%");
      lineLabel.setAttribute("stroke", "");
      lineHolder.appendChild(_svg["default"].newEl("line", {
        x1: x + "%",
        y1: 0,
        x2: x + "%",
        y2: diagramHeight
      }));

      if (marks[i - 1] && mark.x - marks[i - 1].x < 1) {
        lineLabel.setAttribute("x", marks[i - 1].x + 1 + "%");
        mark.x = marks[i - 1].x + 1;
      } //would use polyline but can't use percentage for points


      lineHolder.appendChild(_svg["default"].newEl("line", {
        x1: x + "%",
        y1: diagramHeight,
        x2: mark.x + "%",
        y2: diagramHeight + 23
      }));
      var isActive = false;

      var onLabelMouseEnter = function onLabelMouseEnter(evt) {
        if (!isActive) {
          isActive = true;

          _dom["default"].addClass(lineHolder, "active"); //firefox has issues with this


          markHolder.parentNode.appendChild(markHolder);
        }
      };

      var onLabelMouseLeave = function onLabelMouseLeave(evt) {
        isActive = false;

        _dom["default"].removeClass(lineHolder, "active");
      };

      lineLabel.addEventListener("mouseenter", onLabelMouseEnter);
      lineLabel.addEventListener("mouseleave", onLabelMouseLeave);
      lineLabelHolder.appendChild(lineLabel);
      markHolder.appendChild(_svg["default"].newEl("title", {
        text: mark.name + " (" + Math.round(mark.startTime) + "ms)"
      }));
      markHolder.appendChild(lineHolder);
      marksHolder.appendChild(markHolder);
      markHolder.appendChild(lineLabelHolder);
    });
    return marksHolder;
  };

  timeLineHolder.appendChild(createTimeWrapper());
  timeLineHolder.appendChild(renderMarks());
  lines.forEach(function (block, i) {
    timeLineHolder.appendChild(createBgRect(block));
  });
  barsToShow.forEach(function (block, i) {
    var blockWidth = block.total || 1;
    var y = 25 * i;
    timeLineHolder.appendChild(createRect(blockWidth, 25, block.start ? block.start - startTimeAdjustmentInMs : 0.001, y, block.cssClass, block.name + " (" + block.start + "ms - " + block.end + "ms | total: " + block.total + "ms)", block.segments));

    var blockLabel = _svg["default"].newTextEl(block.name + " (" + Math.round(block.total) + "ms)", y + (block.segments ? 20 : 17));

    var x = (block.start ? block.start - startTimeAdjustmentInMs : 0.001) / unit;

    if ((block.total || 1) / unit > 10 && _svg["default"].getNodeTextWidth(blockLabel) < 200) {
      blockLabel.setAttribute("class", "inner-label");
      blockLabel.setAttribute("x", x + 0.5 + "%");
      blockLabel.setAttribute("width", blockWidth / unit + "%");
    } else if (x + blockWidth / unit < 80) {
      blockLabel.setAttribute("x", x + blockWidth / unit + 0.5 + "%");
    } else {
      blockLabel.setAttribute("x", x - 0.5 + "%");
      blockLabel.setAttribute("text-anchor", "end");
    }

    blockLabel.style.opacity = block.name.match(/js.map$/) ? "0.5" : "1";
    timeLineLabelHolder.appendChild(blockLabel);
  });
  timeLineHolder.appendChild(timeLineLabelHolder);

  if (title) {
    chartHolder.appendChild(_dom["default"].newTag("h1", {
      text: title
    }));
  }

  chartHolder.appendChild(timeLineHolder);
  return chartHolder;
};

var _default = waterfall;
exports["default"] = _default;


},{"../helpers/dom":6,"../helpers/svg":11}],14:[function(require,module,exports){
"use strict";

var _data = _interopRequireDefault(require("./data"));

var _iFrameHolder = _interopRequireDefault(require("./helpers/iFrameHolder"));

var _navigationTimeline = _interopRequireDefault(require("./components/navigationTimeline"));

var _resourcesTimeline = _interopRequireDefault(require("./components/resourcesTimeline"));

var _legend = _interopRequireDefault(require("./components/legend"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(function () {
  //skip browser internal pages or when data is invalid
  if (location.protocol === "about:" || !_data["default"].isValid()) {
    return;
  }

  var onIFrameReady = function onIFrameReady(addComponentFn) {
    [_legend["default"].init(), new _resourcesTimeline["default"]().init(), _navigationTimeline["default"].init()].forEach(function (componentBody) {
      addComponentFn(componentBody);
    });
  };

  _iFrameHolder["default"].setup(onIFrameReady);
})();


},{"./components/legend":1,"./components/navigationTimeline":2,"./components/resourcesTimeline":4,"./data":5,"./helpers/iFrameHolder":8}],15:[function(require,module,exports){
"use strict";

var _data = _interopRequireDefault(require("./data"));

var _tableLogger = _interopRequireDefault(require("./helpers/tableLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }


},{"./data":5,"./helpers/tableLogger":12}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
