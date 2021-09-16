import data from "./data";
import iFrameHolder from "./helpers/iFrameHolder";

import navigationTimelineComponent from "./components/navigationTimeline";
import ResourcesTimelineComponent from "./components/resourcesTimeline";
import legendComponent from "./components/legend";

(() => {
	//skip browser internal pages or when data is invalid
	if(location.protocol === "about:" || !data.isValid()){
		return;
	}
	const onIFrameReady = (addComponentFn) => {
		[
			legendComponent.init(),
			new ResourcesTimelineComponent().init(),
			navigationTimelineComponent.init(),
		].forEach((componentBody) => {
			addComponentFn(componentBody);
		});
	};

	iFrameHolder.setup(onIFrameReady);
})();
