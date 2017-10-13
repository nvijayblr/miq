'use strict';
backMe.controller('adminProjectCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){

	_scope.projectId = _state.params.projectId;
    _scope.loggedUserId = _appConstant.currentUser.userId;
	_scope.project = {};
    _scope.support = {
        amount: ''
    }
	_scope.images = [];
    _scope.comment = {
        commentInput: ''
    };
	_scope.pieColors = ["#4d9839", "#db4d0d", "#f18b17", "#ecca34", "#01779a"];

	_scope.init = function() {
		_scope.images = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/projects/' + _scope.projectId
		}, function(data){
			_scope.project = data;
			if(_scope.project.length == 0) {
				return;
				//_state.go('home');
			}
			angular.forEach(_scope.project.projectsassets, function(_obj, _index){
				_scope.images.push({
					id : _index+1,
					thumbUrl : _obj.type=='Video' ? _obj.location : 'uploads/'+_obj.location,
					url : _obj.type=='Video' ? _obj.location : 'uploads/'+_obj.location,
					extUrl : '',
					type: _obj.type=='Video'? 'Video' : 'Image',
					videoId: _obj.videoId,
					videoUrl: 'http://www.youtube.com/embed/'+_obj.videoId+'?autoplay=0&showinfo=0&rel=0&loop=1'
				});
			});
			_scope.images.unshift({
				id : 0,
				thumbUrl : 'uploads/'+_scope.project.coverImage,
				url : 'uploads/'+_scope.project.coverImage,
				extUrl : '',
				type: 'Image',
				videoId: '',
				videoUrl: ''
			});
			generateRemainDaysGraph(_scope.project.remaindayshours[0].totalDays, _scope.project.remaindayshours[0].remainDays);
			_scope.spendData = [];
			angular.forEach(_scope.project.spendmoney, function(obj, index){
				_scope.spendData.push({
					label: obj.description,
					value: obj.amount,
					color: _scope.pieColors[index]
				});
			});
			generateSpendMoneyGraph(_scope.spendData);
			
		}, function(err) {
			console.log(err)
		});
	}
	
    _scope.comments = {};
    _scope.getComments = function(_comment, _projectId) {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'comments/'+_scope.projectId
		}, function(data){
           _scope.comments = data;
		}, function(err) {
		});
    }
    
	_scope.likes = {};
	_scope.getLikes = function() {
		_scope.likes = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/likes/weekly?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&projectId='+_scope.projectId
		}, function(data){
			_scope.likes = data;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.views = {};
	_scope.viewCnt = 0;
	_scope.getViews = function() {
		_scope.views = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/views/weekly?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&projectId='+_scope.projectId
		}, function(data){
			_scope.views = data;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.moneyRaised = [];
	_scope.getMoneyRaised = function() {
		_scope.moneyRaised = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/payments/moneyraised?projectId='+_scope.projectId
		}, function(data){
			_scope.moneyRaised = data;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.payments = [];
	_scope.getPayments = function() {
		_scope.payments = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/payments/weekly?projectId='+_scope.projectId
		}, function(data){
			_scope.payments = data;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.accounting = [];
	_scope.getAccounting = function() {
		_scope.accounting = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/accounting/'+_scope.projectId
		}, function(data){
			_scope.accounting = data;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.init();
    _scope.getComments();
	_scope.getLikes();
	_scope.getViews();
	_scope.getMoneyRaised();
	_scope.getPayments();
	_scope.getAccounting();
	
   
	function generateRemainDaysGraph(totaldays, remaindays) {
		var width = 65,
			height = 65,
			twoPi = 2 * Math.PI,
			progress = 0,
			total = totaldays,
			completed = totaldays - remaindays,
			formatPercent = d3.format(".0%");

		var arc = d3.svg.arc()
			.startAngle(0)
			.innerRadius(28)
			.outerRadius(32);

		var svg = d3.select(".completed-days").append("svg")
			.attr("width", width)
			.attr("height", height)
		  	.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var meter = svg.append("g")
			.attr("class", "progress-meter");

		meter.append("path")
			.attr("class", "background")
			.attr("d", arc.endAngle(twoPi));

		var foreground = meter.append("path")
			.attr("class", "foreground");

		/*var text = meter.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", ".35em");*/
		  
		var i = d3.interpolate(progress, completed / total);
		d3.transition().tween("progress", function() {
			return function(t) {
			  progress = i(t);
			  foreground.attr("d", arc.endAngle(twoPi * progress));
			  //text.text(formatPercent(progress));
			};
		});
	}
	
	function generateSpendMoneyGraph(spendData) {

		var svg = d3.select("#spendmoneyGraph").append("svg").attr("width",300).attr("height",300);

		svg.append("g").attr("id","spendmoney");

		Donut3D.draw("spendmoney", spendData, 150, 150, 130, 100, 30, 0.4);
	}

}]);