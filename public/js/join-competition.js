/* globals $ */

'use strict';

var app = app || {};

(function() {
    $('#join').on('click', function(ev) {
        var competitionId = $('#info').attr('data-id');

        $.ajax('/competitions/' + competitionId + '/join', {
                method: "PUT"
            })
            .done(function(result) {
                var username = result.result.username,
                    points = result.result.points,
                    $thead = $("#joined-users").find("thead"),
                    $newRow = $("<tr>").appendTo($thead),
                    $newCol = $("<td>").appendTo($newRow);

                $("<a>").attr("href", '/users/' + username).addClass("title").html(username).appendTo($newCol);
                // $("<td>").html(points).appendTo($newRow);

                app.notifier.showNotification("You joined this competition", "success");
                $("#leave").removeClass("hidden");
                $("#join").addClass("hidden");
            })
            .fail(function(err) {
                app.notifier.showNotification(err.message, "error");
            });

        ev.preventDefault();
        return false;
    })

    $('#leave').on('click', function(ev) {
        var competitionId = $("#info").attr("data-id");

        $.ajax('/competitions/' + competitionId + '/leave', {
                method: "PUT"
            })
            .done(function(result) {
                $('tr:contains(' + result.username + ')').remove();
                $("#leave").addClass("hidden");
                $("#join").removeClass("hidden");

                app.notifier.showNotification("You left this competition!", "success")
            })
            .fail(function(err) {
                app.notifier.showNotification(err.message, "error");
            });

        ev.preventDefault();
        return false;

    });
}());