(function() {
  angular.module('vtex.ngCurrencyMask', []).service('CurrencyMaskUtils', function() {
    var CurrencyMaskUtils;
    return CurrencyMaskUtils = (function() {
      function CurrencyMaskUtils() {}

      CurrencyMaskUtils.clearSeparators = function(value) {
        if (value == null) {
          return;
        }
        if (typeof value === 'number') {
          value = value.toString();
        }
        return parseFloat(value.replace(/,/g, '.').replace(/\.(?![^.]*$)/g, ''));
      };

      CurrencyMaskUtils.toIntCents = function(value) {
        if (value != null) {
          return Math.abs(parseInt(CurrencyMaskUtils.clearSeparators(value) * 1));
        }
      };

      CurrencyMaskUtils.toFloatString = function(value) {
        if (value != null) {
          //return (Math.abs(value / 1)).toFixed(2);
			var formated = Math.abs(parseInt(CurrencyMaskUtils.clearSeparators(value) * 1));
          	return formated ? formated : '';
        }
      };

      return CurrencyMaskUtils;

    })();
  }).directive('currencyMask', function($timeout, $filter, CurrencyMaskUtils) {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var Utils, applyCurrencyFilter, errorPrefix;
        errorPrefix = 'VTEX ngCurrencyMask';
        if (!ctrl) {
          throw new Error(errorPrefix + " requires ngModel!");
        }
        if (!/input/i.test(elem[0].tagName)) {
          throw new Error(errorPrefix + " should be binded to <input />.");
        }
        Utils = CurrencyMaskUtils;
        applyCurrencyFilter = function(value) {
          if (value == null) {
            value = ctrl.$viewValue || elem[0].value;
          }
          if (value != null) {
			//$filter('currency')(Utils.clearSeparators(value), 'Rs', 2);
			value = value.toString();
			value = value.replace (/,/g, "");
			return elem[0].value = $filter('currency')(Utils.clearSeparators(value), '', 0);
          }
        };
        elem[0].addEventListener('blur', function() {
          return applyCurrencyFilter();
        });
        ctrl.$parsers.unshift(Utils.toIntCents);
        ctrl.$formatters.unshift(Utils.toFloatString);
        return $timeout(applyCurrencyFilter);
      }
    };
  });

}).call(this);
