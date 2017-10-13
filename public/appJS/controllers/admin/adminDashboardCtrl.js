'use strict';
backMe.controller('adminDashboardCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope){
	_rootScope.adminTab = 'dashboard';
	console.log('adminDashboardCtrl...');

	
	var randomScalingFactor = function() {
        return Math.round(Math.random() * 100);
    };
	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	var projectLocationConfig = {
        type: 'pie',
        data: {
            datasets: [{
                data: [],
                backgroundColor: [],
                label: 'Location'
            }],
            labels: []
        },
        options: {
            responsive: true,
            legend: {
                position: 'bottom',
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
	
	var projectTrendingConfig = {
        type: 'bar',
        data: {
            datasets: [{
                data: [],
                backgroundColor: [],
                label: 'Projects'
            }],
            labels: []
        },
        options: {
            responsive: true,
            legend: {
                position: 'bottom',
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };
	
	var projectLocation = document.getElementById("projects-location-chart").getContext("2d");
	var projectLocationChart = new Chart(projectLocation, projectLocationConfig);

	var projectTrending = document.getElementById("projects-trending-chart").getContext("2d");
	var projectTrendingChart = new Chart(projectTrending, projectTrendingConfig);

	_scope.toDate = moment().format('YYYY-MM-DD');
	_scope.initLocationGraph = function() {
		console.log(_appConstant.currentAdmin.adminId)
		_scope.projects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/statistics/projectCountByLocation?fromDate=2017-03-01&toDate='+_scope.toDate+'&role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId
		}, function(data){
			projectLocationConfig.data.datasets[0].data = [];
			projectLocationConfig.data.datasets[0].backgroundColor = [];
			projectLocationConfig.data.labels = [];
			angular.forEach(data, function(obj) {
				projectLocationConfig.data.datasets[0].data.push(obj.projectCount);
				projectLocationConfig.data.datasets[0].backgroundColor.push(getRandomColor());
				projectLocationConfig.data.labels.push(obj.location);
			});
			projectLocationChart.update();
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.initLocationGraph();

	_scope.initTrendingGraph = function() {
		_scope.projects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/statistics/projectscount?fromDate=2017-03-01&toDate='+_scope.toDate+'&role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId
		}, function(data){
			console.log(data);
			for(var i=0; i<projectTrendingConfig.data.datasets.length; i++) {
				projectTrendingConfig.data.datasets[i].data = [];
				projectTrendingConfig.data.datasets[i].backgroundColor = [];
			}
			projectTrendingConfig.data.labels = [];
			angular.forEach(data, function(obj) {
				projectTrendingConfig.data.datasets[0].data.push(obj.projectCount);
				projectTrendingConfig.data.datasets[0].backgroundColor.push(window.chartColors.orange);
				projectTrendingConfig.data.labels.push(obj.monthYear);
			});
			projectTrendingChart.update();
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.initTrendingGraph();

}]);

