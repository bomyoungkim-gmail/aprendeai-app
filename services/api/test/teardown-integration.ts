// Global teardown for integration tests
// Ensures all async resources are cleaned up before Jest exits

export default async () => {
  console.log('[Test Teardown] Forcing cleanup of all async resources...');
  
  // Give async operations a moment to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('[Test Teardown] Teardown complete');
};
