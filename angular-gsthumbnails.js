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
			"<div>" +
				"<div " +
					"style=\"position: absolute;\"" +
					"ng-class=\"{hidden: popupMovieThumbnails != true || latestRequestedThumbnailId != id}\"" +
					"ng-style=\"hoverPosition\">" +
					"<div " +
						"ng-style=\"hoverStyle\"" +
						"ng-mouseout=\"stopThumbnails(id, true)\">" +
						"<img ng-style=\"hoverFrameStyle\" ng-src=\"{{frameSrc}}\">" +
					"</div>" +
				"</div>" +
				"<div " +
					"ng-style=\"imgStyle\"" +
					"ng-mouseover= \"startThumbnails(id, getFunction, config)\"" +
					"ng-mouseout = \"stopThumbnails(id, false)\">" +
					"<img ng-style=\"frameStyle\" ng-src=\"{{frameSrc}}\">" +
				"</div>" +
			"</div>",
		link: function(scope) {
			scope.imgStyle = {
				"background-image"   : "url(" + scope.src + ")",
				"height"             : scope.height,
				"width"              : scope.width,
				"background-size"    : scope.size,
				"background-position": scope.position,
				"background-repeat"  : scope.repeat
			};

			scope.frameStyle = {
				"height": scope.height,
				"width" : scope.width
			};

			scope.hoverPosition = {
				"margin-top" : scope.hoverTop,
				"margin-left": scope.hoverLeft
			};

			scope.hoverStyle = {
				"background-image"   : "url(" + scope.src + ")",
				"height"             : scope.hoverHeight,
				"width"              : scope.hoverWidth,
				"background-size"    : scope.size,
				"background-position": scope.position,
				"background-repeat"  : scope.repeat
			};

			scope.hoverFrameStyle = {
				"height": scope.hoverHeight,
				"width" : scope.hoverWidth
			};

			scope.$watch("src", function () {
				scope.imgStyle["background-image"] = "url(" + scope.src + ")";
				scope.hoverStyle["background-image"] = "url(" + scope.src + ")";
			});


			// Data ID of the current thumbnail
			scope.latestRequestedThumbnailId = null;
			// The timeout of the current thumbnail so it can be canceled
			scope.currentThumbnailTimeout = null;
			// ID of the current thumbnail in thumbnail list
			scope.currentThumbnailImageId = null;
			// Array of current thumbnails of current movie
			scope.currentThumbnailImages = null;
			// Should thumbnails enlarge during display?
			scope.popupMovieThumbnails = true;
			// Time to switch to next thumbnail
			scope.timeToSwitchToNextThumbnail = 500;
			// Maximum number of thumbnails to display
			scope.maximumThumbnails = 999;
			// Start time of the latest AJAX request to calculate shorter first timeout time
			scope.startTimeOfLastMovieThumbnailRequest = null;
			// Array of original images
			scope.originalImage = [];

			// Set the current thumbnail
			scope.setThumbnail = function() {
				// Check if there are thumbnails available
				if(scope.currentThumbnailImages.length > 1) {
					// Round robin when last thumbnail is reached
					if(scope.currentThumbnailImageId >= scope.maximumThumbnails || scope.currentThumbnailImageId >= scope.currentThumbnailImages.length) {
						scope.currentThumbnailImageId = 0;
					}

					// Set image to current thumbnail
					scope.src = scope.currentThumbnailImages[scope.currentThumbnailImageId];
					// Increase thumbnail ID for next run
					scope.currentThumbnailImageId++;
					// Schedule next thumbnail
					scope.currentThumbnailTimeout = $timeout(scope.setThumbnail, scope.timeToSwitchToNextThumbnail);
				}
			};

			// Start thumbnail slide show for given movie id
			scope.startThumbnails = function(id, getFunction, config) {
				// Set config variables
				if(config !== undefined) {
					scope.popupMovieThumbnails = config.popup;
					scope.timeToSwitchToNextThumbnail = config.timeout;
					scope.maximumThumbnails = config.max;
				}

				// Stop running thumbnails
				scope.stopThumbnails(scope.latestRequestedThumbnailId, true);
				id = parseInt(id);
				scope.latestRequestedThumbnailId = id;
				scope.startTimeOfLastMovieThumbnailRequest = new Date();

				// Make a copy of the original image
				scope.originalImage[id] = angular.copy(scope.src);

				// Call getFunction to get thumbnail data
				getFunction(id, function(data) {
					// Check if the result is still valid or if other thumbnails have been started in the meantime
					if(data.id === scope.latestRequestedThumbnailId) {
						// Cancel other running thumbnail slide shows
						if(scope.currentThumbnailTimeout !== null) {
							$timeout.cancel(scope.currentThumbnailTimeout);
						}

						// Restore all original images (Not necessary?)
						/*for(var i in scope.originalImage) {
						 scope.src = angular.copy(scope.originalImage[i]);
						 }*/

						// Set current thumbnail to first in list
						scope.currentThumbnailImageId = 0;
						// Replace list of thumbnails with result
						scope.currentThumbnailImages = data.images;

						// The optimized timing will only be used when using popup thumbnails
						// This is only a cosmetically setting, it just feels better when using the feature
						if(scope.popupMovieThumbnails === true) {
							// Subtract the time which has been needed for AJAX call from first timeout
							var timeToWaitUntilSecondThumbnail = scope.timeToSwitchToNextThumbnail - parseInt(new Date() - scope.startTimeOfLastMovieThumbnailRequest);
							if(timeToWaitUntilSecondThumbnail < 0) {
								timeToWaitUntilSecondThumbnail = 0;
							}
							scope.currentThumbnailTimeout = $timeout(scope.setThumbnail, timeToWaitUntilSecondThumbnail);
						} else {
							// When not using the popup feature, the slideshow starts immediately after receiving the data
							scope.setThumbnail();
						}
					}
				});
			};

			// Stop thumbnail slideshow for specific movie id
			scope.stopThumbnails = function(id, fromPopUp) {
				if(id !== null) {
					// It is important to check if popups are enabled and which function call triggered the stop
					// When popup is enabled only calls from the popup div lead to a stop
					if(scope.popupMovieThumbnails === false || scope.popupMovieThumbnails === true && fromPopUp === true) {
						scope.latestRequestedThumbnailId = null;
						$timeout.cancel(scope.currentThumbnailTimeout);
						// Restore original image
						scope.src = angular.copy(scope.originalImage[id]);
					}
				}
			};
		}
	};
});
