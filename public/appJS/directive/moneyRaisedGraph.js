'use strict';
backMe.directive('moneyRaisedGraph', [function($window) {
	return {
		restrict: 'E',
		scope: {
			data: '='
		},
		template: '<div class="completed-amount" width="70" height="70"></div>',
		link: function (scope, element, attrs) {
			if(!scope.data.amtReceived)
				scope.data.amtReceived = 1;
			
			var rawSvg = element.find("div")[0];

			scope.render = function(data) {
				var width = 130,
					height = 130,
					twoPi = 2 * Math.PI,
					formatPercent = d3.format(".0%");

				var arc = d3.svg.arc()
				.startAngle(0)
				.innerRadius(58)
				.outerRadius(64);

				var progress = 0;
				data.completed = data.amtReceived;

				$(rawSvg).html('');
				var svg = d3.select(rawSvg).append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
				var meter = svg.append("g")
					.attr("class", "progress-meter");
				meter.append("path")
					.attr("class", "background")
					.attr("d", arc.endAngle(twoPi));
				
				var endAngle = (progress, data.completed / data.amtNeeded)* twoPi;
				var foreground = meter.append("path")
					.attr("class", "foreground")
					.attr("d", arc.endAngle(endAngle));
			}			
		
		/*var i = d3.interpolate(progress, completed / total);
		d3.transition().tween("progress", function() {
			return function(t) {
			  progress = i(t);
			  foreground.attr("d", arc.endAngle(twoPi * progress));
			};
		});*/

			scope.render(scope.data);
			/*scope.$watch(function(){
				return scope.render(scope.data);
			});
			*/
			
			
		}
	};
}]);  
