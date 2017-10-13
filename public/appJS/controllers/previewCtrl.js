'use strict';
backMe.controller('previewCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'Upload', 'appConstant', '$rootScope', '$sce', function(_scope, _services, _timeout, _state, _http, _appConstant, _rootScope, _sce){
	_scope.step = 5;
	_scope.stepsTitle = "Actual representation of your campaign and submission";
	_scope.projectId = _state.params.projectId;
	_scope.pieColors = ["#4d9839", "#db4d0d", "#f18b17", "#ecca34", "#01779a"];
	
	//console.log(_rootScope.images.length);

	if(_rootScope.images.length==0) {
		angular.forEach(_scope.project.projectsassets, function(_obj, _index){
			console.log(_obj);
			_rootScope.images.push({
				id : _index+1,
				thumbUrl : _obj.type=='Video' ? _obj.location : 'uploads/'+_obj.location,
				url : _obj.type=='Video' ? _obj.location : 'uploads/'+_obj.location,
				extUrl : '',
				type: _obj.type=='Video' ? 'Video' : 'Image',
				videoId: _obj.videoId,
				videoUrl: 'http://www.youtube.com/embed/'+_obj.videoId+'?autoplay=0&showinfo=0&rel=0&loop=1'
			});
		});
		if(_scope.project.projectsassets) {
			_rootScope.images.unshift({
				id : 0,
				thumbUrl : 'uploads/'+_scope.project.coverImage,
				url : 'uploads/'+_scope.project.coverImage,
				extUrl : '',
				type: 'Image',
				videoId: '',
				videoUrl: ''
			});
		}
	}

	_scope.spendData = [];
	angular.forEach(_scope.project.spendmoney, function(obj, index){
		_scope.spendData.push({
			label: obj.description,
			value: obj.amount,
			color: _scope.pieColors[index]
		});
	});
	
	console.log(_scope.spendData.length);
	
	if(_scope.spendData.length!=0){
		_timeout(function(){
			generateSpendMoneyGraph(_scope.spendData);
		}, 1000);
	}
	
	_scope.submitProject = function() {
		if(_scope.project.posterImg || _scope.project.projectImages) {
			delete _scope.project.posterImg;
		  	delete _scope.project.projectImages;
		}		
		_scope.project.status = 'ACTIVE';
		_scope.data = _scope.project;
		_scope.project.stepsCompleted = _scope.step;
		_http.upload({
			method: 'POST',
			url: _appConstant.baseUrl + 'projects',
			data: _scope.data
		}).then(function (data) {
			if(_scope.edit){
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Project updated successfully !!');
				_rootScope.projectCreated = false;
			}else{
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Project created successfully !!');
				_rootScope.projectCreated = true;
			}
			_state.go('dashboard', {userId:_appConstant.currentUser.userId});
		}, function (err) {
			_services.toast.show(err.data);
			console.log(err);
		});
	}
	
	function generateSpendMoneyGraph(spendData) {
		console.log(spendData);
		//if($('#spendmoneyGraph').html()) return;
		$('#spendmoneyGraph').html('');
		var svg = d3.select("#spendmoneyGraph").append("svg").attr("width",300).attr("height",300);
		svg.append("g").attr("id","spendmoney");
		Donut3D.draw("spendmoney", spendData, 150, 150, 130, 100, 30, 0.4);
	}

	_scope.playVideo = function(img) {
		console.log('Play Video', img.videoId);
	}
	
}]);