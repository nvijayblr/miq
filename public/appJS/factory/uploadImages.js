'use strict';
backMe.factory('uploadImages', ['BaseServices', '$timeout', '$state', 'Upload', '$q', 'appConstant', function (_services, _timeout, _state, _http, _q, _appConstant) {
	var deferred = _q.defer();
	return {
        getUnitData : function(_inputData){
        return _http.upload({
				method: 'POST',
				url: _appConstant.baseUrl + 'projectImages',
				data: _inputData
			}).then(function (res) {
				/*_scope.assets = res.data[0];
				if(_scope.data.projectsassets) {
					_scope.data.projectsassets.push({
						assetId: _scope.assets[4],
						projectId: _scope.assets[0],
						userId: _scope.assets[1],
						type: _scope.assets[2],
						location: _scope.assets[3]
					});
				}*/
				deferred.resolve(res);
			}, function (err) {
				console.log(err);
				deferred.reject(err);
				_services.toast.show(err.data);
			}, function (evt) {
				
		});
     }
	}

}]);

