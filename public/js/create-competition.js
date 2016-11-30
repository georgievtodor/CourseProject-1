'use strict';

let marker;

function initMap() {
    let coordinates = { lat: 42.6977, lng: 23.3219 },
        map = new google.maps.Map(document.getElementById('map'), {
            center: coordinates,
            zoom: 10
        });

    google.maps.event.addListener(map, 'click', function(event) {
        marker = addMarker(event.latLng, map, marker);
    });

}

function addMarker(location, map, oldMarker) {
    let marker = new google.maps.Marker({
        position: location,
        map: map
    });

    if (oldMarker) {
        oldMarker.setMap(null);
    }

    return marker;
}

$("#create").on("click", function(ev) {
    if (!marker) {
        toastr.error("You should choose a location on the map.")

        ev.preventDefault();
        return false;

    }

    let latitude = marker.getPosition().lat();
    let longitude = marker.getPosition().lng();
    let competitionName = $("#competitionName").val();
    let place = $("#place").val();
    let points = $("#points").val();
    let level = $("#level").val();
    let category = $("#category").val();
    let keys = $("#keys").val();
    let startDate = $("#startDate").val();
    let endDate = $("#endDate").val();

    let data = { competitionName, place, points, level, category, keys, latitude, longitude, startDate, endDate }

    console.log(data);
    ev.preventDefault();

    $.ajax("/competitions/create", {
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json"
    }).
    done(() => {
            toastr.success("magic");
        })
        .fail(() => {
            toastr.error("You are a fail!")
        })
});