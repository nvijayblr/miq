'use strict';
backMe
.service('paginationServices', ['$filter', '$timeout', function(_filter){
	/**this.init = function(_scope, data){
		_scope.currentPage = 0;
		_scope.pageSize = 10;
		_scope.q = '';
		_scope.getData = function () {
			return _filter('filter')(data, _scope.q)
		};
		_scope.getNumber = function(num) {
				return new Array(num);   
		};
		_scope.changePage = function(page){
			_scope.currentPage = page;
		};
		_scope.numberOfPages=function(){
            if(_scope.getData())
			 return Math.ceil(_scope.getData().length/_scope.pageSize);                
            else
                return 0;
		}
	};**/
	
	this.initModal = function(_scope, data){
		_scope.modalCurrentPage = 0;
		_scope.modalPageSize = 10;
		_scope.q = '';
		_scope.getModalData = function () {
			return _filter('filter')(data, _scope.q)
		};
		_scope.getModalNumber = function(num) {
				return new Array(num);   
		};
		_scope.changeModalPage = function(page){
			_scope.modalCurrentPage = page;
		};
		_scope.numberOfModalPages=function(){
			return Math.ceil(_scope.getModalData().length/_scope.modalPageSize);                
		}
	};
    
    this.init = function(_scope, data){
		_scope.currentPage = 0;
		_scope.pageSize = _scope.pageSize ? _scope.pageSize : 20;
		_scope.q = '';
		_scope.getData = function () {
			return _filter('filter')(data, _scope.q)
		};
		
        _scope.getNumberWitStartNumber = function(_start) {
            var _tempArray = [], count = 1;
            for(var _i = _start; _i <= _scope.numberOfPages(); _i++){
                if(count <= 10)
                    _tempArray.push(_i);
                else
                    break;
                count = count+1;
            }
            return _tempArray;   
		};
        
		_scope.changePage = function(page){
			_scope.currentPage = page;
		};
        
		_scope.numberOfPages=function(){
            if(_scope.getData())
                return Math.ceil(_scope.getData().length/_scope.pageSize);                
            else
                return 0;
		};
        
        _scope.showLastBtn = true;
        _scope.firstSet = function(){
            _scope.currentPageSeri = _scope.getNumberWitStartNumber(1);
            _scope.currentPage = 0;
            if(_scope.numberOfPages() > 10)
                _scope.showLastBtn = true;
            else
                _scope.showLastBtn = false;
        };
        _scope.firstSet();
        _scope.lastSet = function(){
            _scope.showLastBtn = false;
            if(_scope.numberOfPages()%10 == 0)
                _scope.currentPage = _scope.numberOfPages()-10;
            else
               _scope.currentPage = _scope.numberOfPages()-_scope.numberOfPages()%10;
            _scope.currentPageSeri = _scope.getNumberWitStartNumber(_scope.currentPage+1);
			//shows the last page in the last set. If we remove the below line it shows the first page in the last set.
			_scope.currentPage = _scope.numberOfPages()-1;
        };
        _scope.prevSet = function(){
            _scope.currentPage = _scope.currentPageSeri[0] - 11;
            _scope.currentPageSeri = _scope.getNumberWitStartNumber(_scope.currentPage+1);
            if(_scope.numberOfPages() > 10 && _scope.currentPage+10 < _scope.numberOfPages())
                _scope.showLastBtn = true;
            else
                _scope.showLastBtn = false;
        };
        _scope.nextSet = function(){
            _scope.currentPage = _scope.currentPageSeri[9];
            _scope.currentPageSeri = _scope.getNumberWitStartNumber(_scope.currentPage+1);
            if(_scope.numberOfPages() > 10 && _scope.currentPage+10 < _scope.numberOfPages())
                _scope.showLastBtn = true;
            else
                _scope.showLastBtn = false;
        };
	};
}]);