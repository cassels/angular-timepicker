(function withAngular(angular) {
	angular.module('gc.timepicker', [])
		.filter('gcPad', function () {
			return function (n, len) {
				var num = parseInt(n, 10);
				len = parseInt(len, 10);
				if (isNaN(num) || isNaN(len)) {
					return n;
				}
				num = ''+num;
				while (num.length < len) {
					num = '0'+num;
				}
				return num;
			};
		})
		.filter('gcRange', function () {
			return function (input, total) {
				for (var i = 0; i < parseInt(total); i++) {
					input.push(i);
				}
				return input;
			};
		})
		.directive('gcTimepicker', ['$compile', '$filter', function($compile, $filter){
			var fixAngle = function angle(angle) {
				return ((angle -= 90) >= 360) ? angle - 360 : ((angle < 0) ? angle + 360: angle );
			}
			, generateHtmlHeader = function() {
				return [
					'<div class="gc-timepicker-header">',
						'<span class="selected-hour"', 
							'data-ng-class="{\'gc-timepicker-muted\': isHourMode()}"',	
							'data-ng-click="setHourMode()">{{ getHour() | gcPad: 2 }}</span>',
						'<span> : </span>',
						'<span class="selected-min"',
							'data-ng-class="{\'gc-timepicker-muted\': isMinMode()}"',
							'data-ng-click="setMinMode()">{{ getMin() | gcPad: 2 }}</span>',
					'</div>'
				];
			}
			, generateHtmlBody = function() {
				return [
					'<div class="gc-timepicker-body">',
						'<div class="gc-timepicker-body-group-hours"',
							'data-ng-show="isHourMode()">',
							'<div class="hour"', 
								'data-ng-repeat="i in [] | gcRange: 24"',
								'data-ng-click="selectHour(i)',
								'"data-ng-class="style.hour(i)">',
									'{{ (i == 0) ? "00" : i }}',
							'</div>',
						'</div>',
						'<div class="gc-timepicker-body-group-mins"',
							'data-ng-show="isMinMode()">',
							'<div class="min"',
								'data-ng-repeat="i in [] | gcRange: 12"',
								'data-ng-click="selectMin(i*5)"',
								'data-ng-class="style.min(i)">',
									'{{ i * 5 }}',
							'</div>',
						'</div>',
					'</div>'
				];
			}
			, generateHtmlTemplate = function() {
				var toReturn = [
					'<div class="gc-timepicker" data-ng-show="isOpen()">',
					'</div>'
				]
				, header = generateHtmlHeader()
				, body = generateHtmlBody()
				, iterator = function iterator(aRow) {
					toReturn.splice(toReturn.length - 1, 0, aRow);
				};

				header.forEach(iterator);
				body.forEach(iterator);

				return toReturn.join('');
			}
			var linkingFunction = function linkingFunction($scope, element, attr) {
				var selector = attr.selector
					, thisInput = angular.element(selector ? element[0].querySelector('.' + selector) : element[0].children[0])
					, htmlTemplate = generateHtmlTemplate()	
					, isOpen = false
					, MODE_HOUR = 'HOUR'
					, MODE_MIN = 'MIN'
					, mode = MODE_HOUR
					, time = new Date()
					, hour = time.getHours()
					, min = time.getMinutes()
					, dateFormat = attr.dateFormat || 'HH:mm'
					, style = {
						hour: function(i) {
							var rtn = "angle-" + ((i <= 12 && i > 0) ? "sm" : "md");
							return rtn += ("-" + fixAngle(i * 30) + ((i <= 12 && i > 0) ? "" : " text-sm") + ((hour == i) ? " selected" : ""));
						}, 
						min: function (i) {
							return "angle-md-" + fixAngle(i*30) + ((min == (i*5)) ? " selected" : "");
						}
					}
					, bodyClickHandler = function() {
						$scope.$apply(function(){
							closeClockFace();	
						});
					}
					, openClockFace = function() {
						if (!isOpen) {
							$('html').on('mousedown', 'body', bodyClickHandler);
							mode = MODE_HOUR;
							isOpen = true;
						}
					}
					, closeClockFace = function() {
						if (isOpen) {
							$('html').off('mousedown', 'body', bodyClickHandler);
							isOpen = false;
						}
					}
					, setInputValue = function setInputValue() {
						var modelDate = new Date();
						modelDate.setHours(hour);
						modelDate.setMinutes(min);
						thisInput.val($filter('date')(modelDate, dateFormat));

						thisInput.triggerHandler('input');
						thisInput.triggerHandler('change');//just to be sure;
					};

				thisInput.after($compile(angular.element(htmlTemplate))($scope));
				
				$scope.style = {
					hour: style.hour,
					min: style.min
				};
				$scope.isOpen = function() {
					return isOpen;
				}
				$scope.isHourMode = function() {
					return mode == MODE_HOUR;
				}
				$scope.isMinMode = function() {
					return mode == MODE_MIN;
				}
				$scope.setHourMode = function() {
					mode = MODE_HOUR;
				}
				$scope.setMinMode = function() {
					mode = MODE_MIN;
				}
				$scope.getHour = function() {
					return hour;
				}
				$scope.getMin = function() {
					return min;
				}
				$scope.selectHour = function(h) {
					hour = h;
					mode = MODE_MIN;
				}
				$scope.selectMin = function(m) {
					min = m;
					setInputValue();
					closeClockFace();
				}
				
				thisInput.on('focus click', function onFocusAndClick() {
					$scope.$apply(function(){
						openClockFace();
					});
				});
				$(element).on('mousedown', function(e){
					e.stopPropagation();
				});

			};
			
			return {
				restrict: 'E',
				scope: {
				},
				link: linkingFunction
			};

			/*return {
				restrict: 'E',
				transclude: true,
				scope: {
					ngModel:'='
				},
				//template: '<div>{{ ctrl.a }}</div>',
				templateUrl: 'snippets/timepicker.html',
				controllerAs: 'ctrl',
				link: linkingFunction,
				controller: function($element, $transclude, $scope) {
					
					self.selectHour = function(i) {
						self.hour = i;
						self.mode = 'm';
						console.log(self.hour);
					}
					
					self.selectMin = function(i) {
						self.min = i;
						close();
					}
					
					
					
					var time = moment();
					self.hour = time.hour();
					self.min = time.minute();
					self.open = false;
					
					$scope.sTime = self.time;
					
				}
			};*/
		}]);
}(angular));