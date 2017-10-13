'use strict';
backMe
.service('mainServices', ['$state', function(_state){
	this.applySorting = function(_obj, _default, order){
		if(_default)
			_obj.sort_propertyName = _default;
		else
			_obj.sort_propertyName = null;
		_obj.sortBy = function(sort_propertyName) {
			_obj.sort_reverse = (_obj.sort_propertyName === sort_propertyName) ? !_obj.sort_reverse : false;
			_obj.sort_propertyName = sort_propertyName;
		};
	};
	
    this.exportData = function(_tablId, _fileName){
        var blob = new Blob([document.getElementById(_tablId).innerHTML], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
        });
        saveAs(blob, _fileName);
    };
    
}]);