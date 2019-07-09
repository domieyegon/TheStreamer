'use strict';


/**
 * @ngdoc function
 * @name theStreamerApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the theStreamerApp
 */
angular.module('theStreamerApp')
  .controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {
    var vm = this;

    const videoPlayer = document.getElementById('myVideo');
    const videoPlaylist = document.getElementById("playlist");
    const resourceUrl = '../videos/frag_blessings.mp4';


    var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
    var totalSegments = 5;
    var segmentLength = 0;
    var segmentDuration = 0;
    var bytesFetched = 0;
    var requestedSegments = [];

    var videoNodes;
    var videos;

    $scope.playVideo = playVideo;
    // $scope.someVideos = null;

    // the segments of the video
    for (var i = 0; i < totalSegments; ++i) {
      requestedSegments[i] = false;
    }

    function videoSource(list) {
      var rer = angular.forEach(list, function (url) {
       return  url.source; 
      })
      console.log(rer.push(url.source));
    }

    var mediaSource = null;
    // check if the video is supported by the browser
    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
      mediaSource = new MediaSource();
      console.log(mediaSource.readyState); // closed
      videoPlayer.src = URL.createObjectURL(mediaSource);
      mediaSource.addEventListener('sourceopen', sourceOpen);

    } else {
      console.error('Unsupported MIME type or codec: ', mimeCodec);
    }

    var sourceBuffer = null;
    function sourceOpen() {
      console.log(this.readyState); // open

      sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

      fetchVideoLength(resourceUrl, function (videoLength) {
        console.log((videoLength / 1024 / 1024).toFixed(2), 'MB');

        segmentLength = Math.round(videoLength / totalSegments);

        fetchRange(resourceUrl, 0, segmentLength, appendSegment);

        requestedSegments[0] = true;
        videoPlayer.addEventListener('timeupdate', checkBuffer);
        videoPlayer.addEventListener('canplay', function () {
          segmentDuration = videoPlayer.duration / totalSegments;
          videoPlayer.play();
        });

        videoPlayer.addEventListener('seeking', seek);

      });
    }

    function fetchVideoLength(url, cb) {
      // console.log(url);
      // console.log(cb);
      var xhr = new XMLHttpRequest();
      xhr.open('head', url);
      xhr.onload = function () {
        cb(xhr.getResponseHeader('content-length'));
      };
      xhr.send();

    }

    function fetchRange(url, start, end, cb) {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url);
      xhr.responseType = 'arraybuffer';
      xhr.setRequestHeader('Range', 'bytes=' + start + '-' + end);
      xhr.onload = function () {
        console.log('fetched bytes: ', start, end);
        bytesFetched += end - start + 1;
        cb(xhr.response);
      };
      xhr.send();
    }

    function appendSegment(chunk) {
      sourceBuffer.appendBuffer(chunk);
    }

    function checkBuffer() {
      var currentSegment = getCurrentSegment();

      if (currentSegment === totalSegments && haveAllSegments()) {
        console.log('last segment', mediaSource.readyState);

        mediaSource.endOfStream();
        videoPlayer.removeEventListener('timeupdate', checkBuffer);

      } else if (shouldFetchNextSegment(currentSegment)) {
        requestedSegments[currentSegment] = true;
        console.log('time to fetch next chunk', videoPlayer.currentTime);

        fetchRange(resourceUrl, bytesFetched, bytesFetched + segmentLength, appendSegment);
      }

    }

    function seek(e) {
      console.log(e);
      if (mediaSource.readyState === 'open') {
        sourceBuffer.abort();
        console.log(mediaSource.readyState);
      } else {
        console.log('seek but not open?');
        console.log(mediaSource.readyState);
      }
    }

    function getCurrentSegment() {
      return ((videoPlayer.currentTime / segmentDuration) | 0) + 1;
    }

    function haveAllSegments() {
      return requestedSegments.every(function (val) {
        return !!val;
      });

    }

    function shouldFetchNextSegment(currentSegment) {
      return videoPlayer.currentTime > segmentDuration * currentSegment * 0.8 && !requestedSegments[currentSegment];
    }

    // function create(listItem) {
    //   console.log(listItem);
    //   var div = document.createElement("div");
    //   var videoIformation = document.createElement("idv");
    //   var title = document.createElement('p');

    //   div.setAttribute("id", listItem.id);
    //   div.setAttribute("class", "video");

    //   videoIformation.setAttribute("class", "video-information");

    //   title.textContent = listItem.name;

    //   videoIformation.appendChild(title);

    //   div.appendChild(videoIformation);

    //   return console.log(div);
    // }

    // function loadPlayList(playlist) {
    //   console.log(playlist);
    //   var fragmentList = document.createDocumentFragment;

    //   angular.forEach(playlist, function (video) {
    //     fragmentList.appendChild(create(video));
    //     create(video);
    //   });
    //   console.log(fragmentList);
    //   // for (let video of playlist) {
    //   //   console.log(video);
    //   //   fragmentList.appendChild(create(video));
    //   // }
    //   videoPlaylist.appendChild(fragmentList);
    //   videoNodes = document.querySelectorAll('.video');
    //   console.log(videoNodes);
    // }

    // get video from its source
    function getVideos() {
      $http.get('media/media.json').then(function (response) {
        $scope.someVideos = response.data;
        videoSource($scope.someVideos);

        console.log($scope.someVideos);
      })
      getJSON('media/media.json', function (res) {
        $scope.videosRTY = res;
        // loadPlayList(videos);
        console.log($scope.videosRTY);
      });
    }



    function getJSON(url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);

      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          var data = JSON.parse(request.responseText);
          callback(data);
        }
      };

      request.onerror = function () {
        console.error("Error occured");
      };

      request.send();
    }

    function playVideo() {

    }

    function init() {
      getVideos();

    }
    init();
  }]);
