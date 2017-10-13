backMe
.directive("paginationDirective", [function() {
    return {
        template : '<ul class="pagination pagination-md" ng-hide="numberOfPages() <= 1"><li ng-hide="currentPage < 10"><a href="" ng-click="currentPage=currentPage-1; firstSet();" >First</a></li><li ng-hide="currentPage < 10"><a href="" ng-click="prevSet()">❮</a></li><li ng-repeat="i in currentPageSeri  track by $index"><a class="{{currentPage+1 == i? \'higlightPagination\':\'pagination-link\'}}" ng-click="changePage(i-1)">{{i}}</a></li><li ng-show="showLastBtn"><a href="" ng-click="nextSet()">❯</a></li><li ng-show="showLastBtn" ><a ng-click="currentPage=currentPage+1; lastSet();">Last</a></li></ul>'
    };
}])
.directive("paginationModalDirective", [function() {
    return {
        template : '<ul class="pagination pagination-md" ng-hide="modalPagination.numberOfPages() <= 1"><li ng-hide="modalPagination.currentPage < 10"><a href="" ng-click="modalPagination.currentPage=modalPagination.currentPage-1; modalPagination.firstSet();" >First</a></li><li ng-hide="modalPagination.currentPage < 10"><a href="" ng-click="modalPagination.prevSet()">❮</a></li><li ng-repeat="i in modalPagination.currentPageSeri  track by $index"><a class="{{modalPagination.currentPage+1 == i? \'higlightPagination\':\'\'}}" ng-click="modalPagination.changePage(i-1)">{{i}}</a></li><li ng-show="modalPagination.showLastBtn"><a href="" ng-click="modalPagination.nextSet()">❯</a></li><li ng-show="modalPagination.showLastBtn" ><a ng-click="modalPagination.currentPage=modalPagination.currentPage+1; modalPagination.lastSet();">Last</a></li></ul>'
    };
}])
.directive("paginationOprHistoryDirective", [function() {
    return {
        template : '<ul class="pagination pagination-md" ng-hide="modalOprPagination.numberOfPages() <= 1"><li ng-hide="modalOprPagination.currentPage < 10"><a href="" ng-click="modalOprPagination.currentPage=modalOprPagination.currentPage-1; modalOprPagination.firstSet();" >First</a></li><li ng-hide="modalOprPagination.currentPage < 10"><a href="" ng-click="modalOprPagination.prevSet()">❮</a></li><li ng-repeat="i in modalOprPagination.currentPageSeri  track by $index"><a class="{{modalOprPagination.currentPage+1 == i? \'higlightPagination\':\'\'}}" ng-click="modalOprPagination.changePage(i-1)">{{i}}</a></li><li ng-show="modalOprPagination.showLastBtn"><a href="" ng-click="modalOprPagination.nextSet()">❯</a></li><li ng-show="modalOprPagination.showLastBtn" ><a ng-click="modalOprPagination.currentPage=modalOprPagination.currentPage+1; modalOprPagination.lastSet();">Last</a></li></ul>'
    };
}])
.directive("paginationDeviceHistoryDirective", [function() {
    return {
        template : '<ul class="pagination pagination-md" ng-hide="modalDevPagination.numberOfPages() <= 1"><li ng-hide="modalDevPagination.currentPage < 10"><a href="" ng-click="modalDevPagination.currentPage=modalDevPagination.currentPage-1; modalDevPagination.firstSet();" >First</a></li><li ng-hide="modalDevPagination.currentPage < 10"><a href="" ng-click="modalDevPagination.prevSet()">❮</a></li><li ng-repeat="i in modalDevPagination.currentPageSeri  track by $index"><a class="{{modalDevPagination.currentPage+1 == i? \'higlightPagination\':\'\'}}" ng-click="modalDevPagination.changePage(i-1)">{{i}}</a></li><li ng-show="modalDevPagination.showLastBtn"><a href="" ng-click="modalDevPagination.nextSet()">❯</a></li><li ng-show="modalDevPagination.showLastBtn" ><a ng-click="modalDevPagination.currentPage=modalDevPagination.currentPage+1; modalDevPagination.lastSet();">Last</a></li></ul>'
    };
}])
.directive('utfInput', [function() {
	return {
		restrict: 'A',
		require: '^ngModel',
		scope: {
			ngModel: '='
		},      
		link: function (scope, element, attrs, ngModel) {
			element.on('input', function() {
				scope.ngModel = element.val();
				scope.$apply();
			});
		}
	};
}]);  

;
