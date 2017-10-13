'use strict';
backMe.controller('adminReportsCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'reports';
	_scope.tab = 'weekly';
	_scope.projectsStat = [];
	_scope.topProjects = [];
	_scope.topFunded = [];
	_scope.overFunded = [];
	_scope.lessFunded = [];
	_scope.topDonors = [];
	_scope.topCities = [];
	_scope.accounting = [];
	var fromDate, toDate;
	_scope.filter = {
		fromDate: moment(moment()).startOf('week').isoWeekday(1).toDate(),
		toDate: moment().toDate(),
		search: ''
	};
	
	_scope.initStatistics = function() {
		_scope.projectsStat = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/statistics?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.projectsStat = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getTopProjects = function() {
		_scope.topProjects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/topProjects?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.topProjects = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getTopFunded = function() {
		_scope.topFunded = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/topFunded?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.topFunded = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getOverFunded = function() {
		_scope.overFunded = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/overFunded?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.overFunded = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getLessFunded = function() {
		_scope.lessFunded = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/lessFunded?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.lessFunded = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getTopDonors = function() {
		_scope.topDonors = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/topDonors?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.topDonors = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getTopCities = function() {
		_scope.topCities = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/topCities?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.topCities = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.getAccounting = function() {
		_scope.accounting = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/report/accounting?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId+'&fromDate='+fromDate+'&toDate='+toDate
		}, function(data){
			_scope.accounting = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.initAll = function() {
		fromDate = moment(_scope.filter.fromDate).format('YYYY-MM-DD');
		toDate = moment(_scope.filter.toDate).format('YYYY-MM-DD');
		_scope.initStatistics();	
		_scope.getTopProjects();
		_scope.getTopFunded();
		_scope.getOverFunded();
		_scope.getLessFunded();
		_scope.getTopDonors();
		_scope.getTopCities();
		_scope.getAccounting();
	}
	_scope.initAll();
	
	_scope.dpDisabled = true;
	_scope.changePeriod = function(_range) {
		_scope.tab = _range;
		_scope.dpDisabled = true;
		if(_range=='weekly') {
			_scope.filter.fromDate = moment(moment()).startOf('week').isoWeekday(1).toDate();
			_scope.filter.toDate = moment().toDate();
		} else if(_range=='monthly') {
			_scope.filter.fromDate = moment().subtract(1,'month').toDate();
			_scope.filter.toDate = moment().toDate();
		} else {
			_scope.filter.fromDate = moment().subtract(3,'month').toDate();
			_scope.filter.toDate = moment().toDate();
			_scope.dpDisabled = false;
		}
		_scope.initAll();
	}
	
	_scope.showAllTopProjects = function() {
		$('#topProjects').modal('show');
	}
	
	_scope.showAllTopFunded = function() {
		$('#topFunded').modal('show');
	}
	
	_scope.showAllOverFunded = function() {
		$('#overFunded').modal('show');
	}
	
	_scope.showAllLessFunded = function() {
		$('#lessFunded').modal('show');
	}
	
	_scope.showAllTopDonors = function() {
		$('#topDonors').modal('show');
	}
	
	_scope.showAllTopCities = function() {
		$('#topCities').modal('show');
	}

	$("#weeklyDatePicker").datetimepicker({
		format: 'MM-DD-YYYY'
	});
	
	$('#monthDatePicker').datetimepicker({
		viewMode: 'years',
		format: 'MM/YYYY'
	});

	$("#weeklyDatePicker").val(moment(moment()).startOf('week').isoWeekday(1).format("MMM DD") + " - " + moment().format("MMM DD"));
	$("#monthDatePicker").val(moment().format("MMM YYYY"));

	$('#weeklyDatePicker').on('dp.change', function (e) {
		var value = $("#weeklyDatePicker").val();
		var firstDate = moment(value, "MM-DD-YYYY").startOf('week').isoWeekday(1).format("MMM DD");
		var lastDate =  moment(value, "MM-DD-YYYY").startOf('week').isoWeekday(7).format("MMM DD");
		$("#weeklyDatePicker").val(firstDate + " - " + lastDate);
		_scope.filter.fromDate =  moment(value, "MM-DD-YYYY").startOf('week').isoWeekday(1).toDate();
		_scope.filter.toDate =  moment(value, "MM-DD-YYYY").startOf('week').isoWeekday(7).toDate();
		_scope.$apply();
	});

	$('#monthDatePicker').on('dp.change', function (e) {
		var value = $("#monthDatePicker").val();
		var firstDate = moment('01/'+value, "DD-MM-YYYY").format("MM/DD/YYYY");
		var lastDate =  moment(firstDate, 'MM/DD/YYYY').endOf('month').format("MM/DD/YYYY");
		$("#monthDatePicker").val(moment(firstDate, 'MM/DD/YYYY').format("MMM YYYY"));
		_scope.filter.fromDate =  moment(firstDate, 'MM/DD/YYYY').toDate();
		_scope.filter.toDate =  moment(lastDate, 'MM/DD/YYYY').toDate();
		_scope.$apply();
	});

}]);


