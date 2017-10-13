'use strict';
backMe
.filter('paginationFilters_startFrom', [function() {
    return function(input, start){
		/*if(!start) start = 0;*/
		start = +start; //parse to int
		if(input)
			return input.slice(start);
	}
}]);