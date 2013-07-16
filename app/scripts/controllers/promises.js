angular.module("examplesApp")
    .controller("PromisesCtrl", function ($scope, $http, $log, $q) {
      var putURL = "http://api.openkeyval.org/store/";
      var getURL = "http://api.openkeyval.org/";

      var sampleKey = "sampleData-1123";
      var sampleValue = {
        "string": "sample string",
        "date": Date.now(),
        "number": 8675309.9,
        "boolean": true
      };

      // For the first promises example, it's a straightforward call to put a JSON value into the OpenKeyval
      // (http://openkeyval.org/). I hate making JSONP calls because they're such a kludge, but we're accessing another
      // domain and that's the way to do it that works across multiple browsers.
      var putPromise = putOpenkeyval(sampleKey, sampleValue);

      // And another to retrieve the same value. Note that we can assign the promise which comes back from $http.get()
      // directly to a variable in the $scope and AngularJS will both notice when the service call completes and
      // dereference the promise to its resolved value automatically.
      putPromise.then(function (response) {
        // Once we've stored our data, let's retrieve it.
        var getPromise = getOpenkeyval(sampleKey);

        // Notice that we're getting a single promise back but we're hooking up multiple different things to it (via a
        // call to .then() and assigning it to a $scope value. Try that with a regular callback...
        getPromise.then(function (response) {
          $log.log("Success", response);
        }, function (response) {
          $log.log("Error", response);
        });

        $scope.firstResult = getPromise;
      });

      // For the second example we make multiple calls to different services aggregating the results of all the calls
      // and merging the results into a single returned value.
      var sample2Key = "sampleData-29348";
      var sample2Key2 = "sampleData-98528";

      var sample2Value = "Ask not what your country can do for you.";
      var sample2Value2 = "Ask what you can do for your country.";

      var putPromise2 = putOpenkeyval(sample2Key, sample2Value);
      var putPromise3 = putOpenkeyval(sample2Key2, sample2Value2);

      $q.all(putPromise2, putPromise3).then(function (response) {
        var getPromise2 = getOpenkeyval(sample2Key);
        var getPromise3 = getOpenkeyval(sample2Key2);

        // Note: We're creating a single promise and assigning it a value which will only ever have the complete value
        // of both requests. There won't ever be a time when you see only the first or second sentence of the quote by
        // accident.
        $scope.completeQuote = $q.all([ getPromise2, getPromise3 ]).then(function (response) {
          return (response[0] + " " + response[1]);
        });
      });

      // For the third example we demonstrate a common pattern for services. We have a local cache which we can use to
      // satisfy some requests and promises can allow us to update the service to perform the local caching without
      // any external difference to the service.


      function putOpenkeyval(key, value) {
        var params = {
          "callback": "JSON_CALLBACK"
        };
        params[key] = value;
        var putPromise = $http.jsonp(putURL, {
          "params": params
        });
        return putPromise;
      }

      function getOpenkeyval(key) {
        return $http.jsonp(getURL + key, {
          "params": {
            "callback": "JSON_CALLBACK"
          }}).then(
            function (response) {
              // In this case we'll dig out the value we actually want and use that to resolve the promise which .then()
              // has created for us.
              return response.data;
            }
        );
      }
    });
