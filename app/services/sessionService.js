(function(angular) {
  'use strict';

  angular
    .module('tutorExchange')
    .factory('sessionService', sessionService);


  sessionService.$inject = ['$http'];
  function sessionService($http) {

    var data = {
    };

    var service = {
      getRequests:      getRequests,
      getAppointments:  getAppointments,
      getOpenSessions:  getOpenSessions,

      createRequest:  createRequest,
      acceptRequest:  acceptRequest,
      rejectRequest:  rejectRequest,

      //rescheduleAppointment:  rescheduleAppointment,
      cancelAppointment:      cancelAppointment,

      closeSession:   closeSession,
      appealSession:  appealSession,
    };

    return service;


    function getRequests() {
      return $http.get('/api/session/get_requests')
        .then(function(response) {
          return response;
        });
    }

    function getAppointments() {
      return $http.get('/api/session/get_appointments')
        .then(function(response) {
          return response;
        });
    }

    function getOpenSessions() {
      return $http.get('/api/session/get_open_sessions')
        .then(function(response) {
          return response;
        });
    }

    function createRequest(session) {
      return $http.post('/api/session/create_request', {session: session})
        .then(function(response) {
          return response;
        });
    }

    function acceptRequest(sessionID) {
      return $http.post('/api/session/accept_request', {sessionID: sessionID})
        .then(function(response) {
          return response;
        });
    }

    function rejectRequest(sessionID) {
      return $http.post('/api/session/reject_request', {sessionID: sessionID})
        .then(function(response) {
          return response;
        });
    }

    // Create a new request and cancel current appointment.
    /*function rescheduleAppointment(sessionID, date, time) {
      return $http.post('/api/session/reschedule_appointment', {sessionID: sessionID})
        .then(function(response) {
          return response;
        });
    }*/

    function cancelAppointment(sessionID) {
      return $http.post('/api/session/cancel_appointment', {sessionID: sessionID})
        .then(function(response) {
          return response;
        });
    }

    function closeSession(sessionID) {
      return $http.post('/api/session/close_session', {sessionID: sessionID})
        .then(function(response) {
          return response;
        });
    }

    function appealSession(sessionID, reason) {
      return $http.post('/api/session/appeal_session', {sessionID: sessionID, reason: reason})
        .then(function(response) {
          return response;
        });
    }

  }

})(angular);
