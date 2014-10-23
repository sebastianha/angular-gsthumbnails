"use strict";

angular.module("ui.gsthumbnails", []).directive("gsthumbnails", function($timeout) {
	return {
		scope: {
			src        : "=",
			frameSrc   : "@",
			height     : "@",
			width      : "@",
			size       : "@",
			position   : "@",
			repeat     : "@",
			hoverHeight: "@",
			hoverWidth : "@",
			hoverTop   : "@",
			hoverLeft  : "@",
			id         : "@",
			getFunction: "=",
			config     : "="
		},
		restrict: "E",
		replace : "true",
		template: "" +
			"<div ng-style=\"divStyle\">" +
				"<div " +
					"style=\"position:absolute;\"" +
					"ng-style=\"imgStyle\"" +
					"ng-mouseover= \"startThumbnails()\"" +
					"ng-mouseout = \"stopThumbnails()\">" +
					"<img ng-style=\"frameStyle\" ng-src=\"{{frameSrc}}\">" +
				"</div>" +
			"</div>",
		link: function(scope) {
			if(scope.repeat === undefined) {
				scope.repeat = "no-repeat";
			}
			if(scope.config === undefined) {
				scope.configIntern = {
					popup  : true,
					timeout: 500,
					max    : 999
				};
			} else {
				scope.configIntern = scope.config
			}

			scope.divStyle = {
				"height": scope.height,
				"width" : scope.width
			};

			scope.defaultStyle = {
				"background-image"   : "url(" + scope.src + ")",
				"height"             : scope.height,
				"width"              : scope.width,
				"background-size"    : scope.size,
				"background-position": scope.position,
				"background-repeat"  : scope.repeat
			};

			scope.defaultFrameStyle = {
				"height": scope.height,
				"width" : scope.width
			};

			scope.hoverStyle = {
				"background-image"   : "url(" + scope.src + ")",
				"height"             : scope.hoverHeight,
				"width"              : scope.hoverWidth,
				"background-size"    : scope.size,
				"background-position": scope.position,
				"background-repeat"  : scope.repeat,
				"margin-top"         : scope.hoverTop,
				"margin-left"        : scope.hoverLeft,
				"z-index"            : 999
			};

			scope.hoverFrameStyle = {
				"height": scope.hoverHeight,
				"width" : scope.hoverWidth
			};

			scope.imgStyle = scope.defaultStyle;
			scope.frameStyle = scope.defaultFrameStyle;

			scope.currentTimeout = null;
			scope.currentThumbnails = null;
			scope.currentThumbnailId = null;

			scope.show = false;

			scope.setThumbnail = function() {
				if(scope.currentThumbnails.length > 1 && scope.show === true) {
					if(scope.currentThumbnailId >= scope.configIntern.max || scope.currentThumbnailId >= scope.currentThumbnails.length) {
						scope.currentThumbnailId = 0;
					}

					scope.imgStyle["background-image"] = "url(" + scope.currentThumbnails[scope.currentThumbnailId] + ")";

					scope.currentThumbnailId++;
					scope.currentTimeout = $timeout(scope.setThumbnail, scope.configIntern.timeout);
				}
			};

			scope.startThumbnails = function() {
				scope.show = true;

				if(scope.configIntern.popup === true) {
					scope.imgStyle = scope.hoverStyle;
					scope.frameStyle = scope.hoverFrameStyle;
				}

				scope.startTime = new Date();

				if(scope.getFunction instanceof Function && scope.id !== undefined) {
					scope.getFunction(scope.id, function(data) {
						if(scope.currentTimeout !== null) {
							$timeout.cancel(scope.currentTimeout);
						}

						scope.currentThumbnailId = 0;
						scope.currentThumbnails = data.images;

						if(scope.configIntern.popup === true) {
							var timeToWaitUntilSecondThumbnail = scope.configIntern.timeout - parseInt(new Date() - scope.startTime);
							if(timeToWaitUntilSecondThumbnail < 0) {
								timeToWaitUntilSecondThumbnail = 0;
							}
							scope.currentTimeout = $timeout(scope.setThumbnail, timeToWaitUntilSecondThumbnail);
						} else {
							scope.setThumbnail();
						}
					});
				}
			};

			scope.stopThumbnails = function() {
				scope.show = false;
				$timeout.cancel(scope.currentTimeout);
				scope.defaultStyle["background-image"] = "url(" + scope.src + ")";
				scope.hoverStyle["background-image"] = "url(" + scope.src + ")";
				scope.imgStyle = scope.defaultStyle;
				scope.frameStyle = scope.defaultFrameStyle;
			};
		}
	};
});
