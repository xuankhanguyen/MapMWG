import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Mapbox, { UserLocation } from '@rnmapbox/maps';
import Geolocation from '@react-native-community/geolocation';

const APIKEY = 'sk.eyJ1IjoiaG9hbmduaGF0dnUzNTIwMiIsImEiOiJjbG9mM3dtYTcwcXFrMmtvMnQzOXloMDVwIn0.9CiSnF15Kbl9svo-jKMK_A';

Mapbox.setAccessToken(APIKEY);
Mapbox.setWellKnownTileServer('Mapbox');

const App: React.FC = () => {
  const [destination, setDestination] = useState<[number, number]>([106.7961, 10.8951]);
  const [routeDirection, setRouteDirection] = useState<any | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([0, 0]);
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      position => {
        setCurrentLocation([
          position.coords.longitude,
          position.coords.latitude,
        ]);
        setLocationLoaded(true);
      },
      error => { console.log(error); setLocationLoaded(true); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }, []);

  function makeRouterFeature(coordinates: [number, number][]): any {
    let routerFeature = {
      type: "FeatureCollection",
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      ],
    };
    return routerFeature;
  }

  async function createRouterLine(startCoords: [number, number], endCoords: [number, number]): Promise<void> {
    const startCoordinates = `${startCoords[0]},${startCoords[1]}`;
    const endCoordinates = `${endCoords[0]},${endCoords[1]}`;
    const geometries = 'geojson';
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoordinates};${endCoordinates}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${APIKEY}`;
    console.log("url: " + url);

    try {
      let response = await fetch(url);
      let json = await response.json();
      let coordinates = json.routes[0].geometry.coordinates;

      if (coordinates.length) {
        const routerFeature = makeRouterFeature([...coordinates]);
        setRouteDirection(routerFeature);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleMapPress = (event: any) => {
    if (event.geometry) {
      // Lấy tọa độ điểm đến từ sự kiện click
      const newDestination: [number, number] = [event.geometry.coordinates[0], event.geometry.coordinates[1]];
      setDestination(newDestination);

      // Tạo tuyến đường mới
      createRouterLine(currentLocation, newDestination);
    }
  };

  return (
    <View style={styles.page}>
      {locationLoaded && (
        <Mapbox.MapView
          style={styles.map}
          styleURL='mapbox://styles/mapbox/outdoors-v12'
          rotateEnabled={true}
          zoomEnabled={true}
          onPress={handleMapPress}
          onDidFinishLoadingMap={async () => {
            createRouterLine(currentLocation, destination);
          }}
        >
          <Mapbox.Camera
            centerCoordinate={currentLocation}
            zoomLevel={15}
            animationMode={'flyTo'}
            animationDuration={6000}
          />
          <Mapbox.PointAnnotation id="marker" coordinate={destination}>
            <View></View>
          </Mapbox.PointAnnotation>
          <Mapbox.UserLocation />
          {routeDirection && (
            <Mapbox.ShapeSource
              id='line'
              shape={routeDirection}
            >
              <Mapbox.LineLayer id="routerLine" style={{ lineColor: "blue", lineWidth: 6 }} />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    flex: 1
  }
});
