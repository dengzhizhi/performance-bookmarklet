import data, { initData } from "./data";
import iFrameHolder, { clearIframeHolder } from "./helpers/iFrameHolder";

import navigationTimelineComponent from "./components/navigationTimeline";
import ResourcesTimelineComponent from "./components/resourcesTimeline";
import legendComponent from "./components/legend";

// increase performance resource timing buffer size to 1500
window.performance.setResourceTimingBufferSize(1500);

const showPerformanceBookmarklet = (options = {}) => {
	//skip browser internal pages or when data is invalid
	if(location.protocol === "about:" || !data.isValid()){
		return;
	}

	const onIFrameReady = (addComponentFn) => {
		[
			legendComponent.init(),
			new ResourcesTimelineComponent(options).init(),
			navigationTimelineComponent.init(),
		].forEach((componentBody) => {
			addComponentFn(componentBody);
		});
	};

	iFrameHolder.setup(onIFrameReady);
};

// Expose the function globally
window.showPerformanceBookmarklet = (options) => {
	// let's clear the module-level variables in iFrameHolder first
	clearIframeHolder();
	initData();
	showPerformanceBookmarklet(options);
};

// Run on initial load
showPerformanceBookmarklet();

// Display help information
console.log(`
Performance Bookmarklet Help
===========================

You can use window.showPerformanceBookmarklet(options) to show the performance data with custom options:

Options:
--------
maxTime: number (default: 300)
    Maximum time in minutes to display in the timeline
    Example: maxTime: 50 // shows 50 seconds of data

domain: string (default: "all")
    Filter resources by domain
    Example: domain: "example.com"

startTime: number (default: 0)
    Start time in seconds from the beginning
    Example: startTime: 2 // starts from 2 seconds

endTime: number (default: null)
    End time in seconds from the beginning
    Example: endTime: 5 // ends at 5 seconds

markFrom: number (default: null)
    Show marks from this time in seconds
    Example: markFrom: 3 // shows marks from 3 seconds

excludeDomainPattern: string (default: "")
    Regex pattern to exclude resources
    Example: excludeDomainPattern: "analytics"

includeDomainPattern: string (default: "")
    Regex pattern to include resources
    Example: includeDomainPattern: "api"

Example usage:
-------------
window.showPerformanceBookmarklet({
    maxTime: 10,
    domain: "example.com",
    startTime: 2,
    endTime: 5,
    markFrom: 3,
    excludeDomainPattern: "analytics",
    includeDomainPattern: "api"
});
`);
