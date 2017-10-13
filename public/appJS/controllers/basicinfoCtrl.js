'use strict';
backMe.controller('basicinfoCtrl', ['$scope', 'BaseServices', '$timeout', 'Upload', 'appConstant', '$state', '$q', '$window', function(_scope, _services, _timeout, _http, _appConstant, _state, _q, _window){
	_scope.step = 1;
	_scope.stepsTitle = "Title and basic campaign description";
	_scope.posterImg = null;
	_scope.posterOriginalImg = '';
	_scope.myCroppedImage='';
	_scope.projectId = _state.params.projectId;
  
	_scope.startProjectDetails = function(isValidForm) {
		if(!isValidForm) {
			angular.element('md-input-container .ng-invalid').first().focus();
			return;
		}
		if(_scope.project.location.display) {
			_scope.project.location = _scope.project.location.display;
		}
		
		if(!_scope.loggedIn && !_appConstant.currentUser.userId) {
			_scope.showSignUp('basicInfo');
			return;
		}
		if(!_scope.project.email) {
			_scope.project.email = _appConstant.currentUser.email;
			//_scope.project.name = _appConstant.currentUser.name;
			_scope.project.userPhoto = _appConstant.currentUser.profilePicture;
		}
		if(!_scope.project.userId) {
		  _scope.project.userId = _appConstant.currentUser.userId;
		}
		_scope.data = _scope.project;
		
		if(_scope.myCroppedImage) {
			_scope.posterImg = _http.dataUrltoBlob(_scope.myCroppedImage, _scope.posterOriginalImg.name);
		} else {
			_scope.posterImg = {};
		}
		
		if(!_scope.project.coverImage && !_scope.myCroppedImage) {
			_services.toast.show('Please select poster image.');
			return;
		}

		if(_scope.project.stepsCompleted < _scope.step) {
			_scope.project.stepsCompleted = _scope.step;
		}
		_scope.data.posterImg = _scope.posterImg;
		console.log(_scope.posterImg);
		_scope.method = 'POST'; //update project
		if(_scope.projectId == 'new')
		  _scope.method = 'PUT'; //create project
		
		if(!_scope.project.location || !_scope.project.category || !_scope.project.description || !_scope.project.about || !_scope.project.title) {
		_services.toast.show('Campaign Title/Location/Category/About should not be blank.');
		return;
		}
		_scope.addRewardsSpendFields(_scope.projectId);
		_http.upload({
			method: _scope.method,
			url: _appConstant.baseUrl + 'projects',
			data: _scope.data
		}).then(function(data) {
		  if(_scope.method == 'POST') {
			 _services.toast.showProject('Campaign details upated successfully !!');
			 _scope.project.coverImage = data.data.coverImage;
		  } else {
			  _scope.projectId = data.data.insertId;
			  _scope.project.projectId = _scope.projectId;
			  _scope.project.coverImage = data.data.coverImage;
			  _services.toast.showProject('Campaign saved in draft successfully !!');
			  _scope.posterImg = undefined;
		  }
		  if(_scope.edit) {
			  _state.go('edit.projectdetails', { 'projectId': _scope.projectId});
		  } else {
			  _state.go('create.projectdetails', { 'projectId': _scope.projectId});
		  }
		}, function(err) {
		  console.log(err);
		  _services.toast.show(err.data);
		}, function(evt) {

		});
	}
	
	_scope.upload = function(croppedDataUrl, name, posterImg) {
		//console.log(croppedDataUrl, name, posterImg);
		_scope.posterImg = _http.dataUrltoBlob(croppedDataUrl, name);
		console.log(_http.dataUrltoBlob(_scope.posterImg))
	}
	
	_scope.focusField = function(_element) {
		if(_element == 'location')
			$("."+_element + " input").focus();
		else
			$("."+_element).focus();
	}
	
	/*Autocomplete - City related functions*/
	_scope.cities = [];
	_scope.loadAllCities = function() {
		_scope.cities = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'cities'
		}, function(data){
			for(var i=0; i<data.length; i++) {
				_scope.cities.push({
					value: data[i].city.toLowerCase(),
					display: data[i].city
				});
			}
		}, function(err) {
			console.log(err)
		});
    }
	_scope.loadAllCities();

    _scope.createFilterFor = function(query) {
		var lowercaseQuery = angular.lowercase(query);
		return function filterFn(state) {
			return (state.value.indexOf(lowercaseQuery) === 0);
		};
    }

	_scope.querySearch = function (query) {
		var results = query ? _scope.cities.filter(_scope.createFilterFor(query) ) : _scope.cities;
		var deferred = _q.defer();
		_timeout(function () { 
			deferred.resolve( results ); 
		},0);
		return deferred.promise;
    }

    _scope.searchText = null;

}]);
