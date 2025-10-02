import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as BackgroundFetch from 'expo-background-fetch';
import { updateSOSLocation, checkActiveSOSSession } from './sosService';

// Define the background task names
export const BACKGROUND_LOCATION_TASK = 'background-location-task';
export const BACKGROUND_FETCH_TASK = 'background-fetch-task';

// Define the location task handler
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    // Check if there's an active SOS session
    const sessionId = await checkActiveSOSSession();
    if (!sessionId) {
      // If no active session, stop tracking
      await stopBackgroundLocationUpdates();
      return;
    }
    
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      // Update the SOS location
      await updateSOSLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined
      });
      
      console.log('Background location updated:', location.coords);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
  }
  return BackgroundFetch.BackgroundFetchResult.NoData;
});

// Define the background fetch task handler
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // Check if there's an active SOS session
  const sessionId = await checkActiveSOSSession();
  
  if (!sessionId) {
    // If no active session, stop tracking
    await stopBackgroundLocationUpdates();
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }
  
  try {
    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    
    // Update the SOS location
    await updateSOSLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined
    });
    
    console.log('Background fetch location updated:', location.coords);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error in background fetch task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Start background location updates
export async function startBackgroundLocationUpdates(): Promise<boolean> {
  try {
    // Request permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }
    
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }
    
    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    // Start the background location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High, // Keep high accuracy for emergency situations
      timeInterval: 3000, // 3 seconds (balanced for data usage and responsiveness)
      distanceInterval: 7, // 7 meters (balanced threshold)
      deferredUpdatesInterval: 15000, // 15 seconds for batch updates
      deferredUpdatesDistance: 15, // 15 meters for batch threshold
      foregroundService: {
        notificationTitle: "SOS Location Tracking Active",
        notificationBody: "Your location is being shared with your emergency contacts",
        notificationColor: "#dc2626"
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
    
    console.log('Background location updates started');
    return true;
  } catch (error) {
    console.error('Error starting background location updates:', error);
    return false;
  }
}

// Stop background location updates
export async function stopBackgroundLocationUpdates(): Promise<boolean> {
  try {
    // Check if tasks are registered before unregistering
    const locationTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    const fetchTaskRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (locationTaskRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('Background location updates stopped');
    }
    
    if (fetchTaskRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('Background fetch task unregistered');
    }
    
    return true;
  } catch (error) {
    console.error('Error stopping background location updates:', error);
    return false;
  }
}

// Check if background location is available (returns true if device can use background location)
export async function isBackgroundLocationAvailable(): Promise<boolean> {
  try {
    const isAvailable = await Location.isBackgroundLocationAvailableAsync();
    return isAvailable;
  } catch (error) {
    console.error('Error checking background location availability:', error);
    return false;
  }
}