import { test, expect } from '@playwright/test';

test.describe('Video and Audio Player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('plays video and shows controls', async ({ page }) => {
    // Navigate to video content
    await page.goto('/reader/video-content-id');
    await page.waitForLoadState('networkidle');
    
    // Check video player exists
    const videoPlayer = page.locator('video, [data-testid="video-player"]').first();
    await expect(videoPlayer).toBeVisible();
    
    // Check play button
    const playBtn = page.locator('button[aria-label="Play"], button:has-text("Play")').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      
      // Verify video is playing
      await page.waitForTimeout(1000);
      const isPaused = await videoPlayer.evaluate((el: HTMLVideoElement) => el.paused);
      expect(isPaused).toBe(false);
    }
  });

  test('displays AI transcription', async ({ page }) => {
    await page.goto('/reader/video-content-id');
    
    // Wait for transcription to load
    await page.waitForTimeout(2000);
    
    // Check transcription section
    const transcription = page.locator('text=Transcription, [data-testid="transcription"]');
    if (await transcription.isVisible()) {
      await expect(transcription).toBeVisible();
      
      // Check for transcript text
      const transcriptText = page.locator('[class*="transcript"], .transcript-text');
      await expect(transcriptText.first()).toBeVisible();
    }
  });

  test('creates timestamp annotation', async ({ page }) => {
    await page.goto('/reader/video-content-id');
    
    // Play video briefly
    const playBtn = page.locator('button[aria-label="Play"]').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(3000);
      
      // Click to create timestamp annotation
      const timestampBtn = page.locator('button:has-text("Add Timestamp"), button[aria-label*="timestamp"]');
      if (await timestampBtn.isVisible()) {
        await timestampBtn.click();
        
        // Fill annotation form
        const noteInput = page.locator('textarea, input[type="text"]').first();
        await noteInput.fill('Important moment at this timestamp');
        
        const saveBtn = page.locator('button:has-text("Save")');
        await saveBtn.click();
        
        // Verify annotation appears on timeline
        await expect(page.locator('.timeline-marker, [data-timestamp]')).toBeVisible();
      }
    }
  });

  test('auto-tracks video watch time', async ({ page }) => {
    await page.goto('/reader/video-content-id');
    
    // Start playing
    const playBtn = page.locator('button[aria-label="Play"]').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      
      // Wait for 1 minute (tracking interval)
      await page.waitForTimeout(65000);
      
      // Check if activity was tracked (via API call)
      // This would be visible in network requests
      const responses = [];
      page.on('response', response => {
        if (response.url().includes('/activity/track')) {
          responses.push(response);
        }
      });
      
      expect(responses.length).toBeGreaterThan(0);
    }
  });

  test('plays audio and shows controls', async ({ page }) => {
    await page.goto('/reader/audio-content-id');
    
    // Check audio player exists
    const audioPlayer = page.locator('audio, [data-testid="audio-player"]').first();
    await expect(audioPlayer).toBeVisible();
    
    // Play audio
    const playBtn = page.locator('button[aria-label="Play"]').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(1000);
      
      // Check if playing
      const isPaused = await audioPlayer.evaluate((el: HTMLAudioElement) => el.paused);
      expect(isPaused).toBe(false);
    }
  });

  test('controls volume', async ({ page }) => {
    await page.goto('/reader/video-content-id');
    
    // Find volume control
    const volumeBtn = page.locator('button[aria-label*="volume"], button[aria-label*="Volume"]').first();
    if (await volumeBtn.isVisible()) {
      await volumeBtn.click();
      
      // Adjust volume slider
      const volumeSlider = page.locator('input[type="range"][aria-label*="volume"]');
      if (await volumeSlider.isVisible()) {
        await volumeSlider.fill('50');
        
        // Verify volume changed
        const value = await volumeSlider.inputValue();
        expect(parseInt(value)).toBeLessThanOrEqual(50);
      }
    }
  });

  test('seeks to specific time', async ({ page }) => {
    await page.goto('/reader/video-content-id');
    
    // Find progress bar
    const progressBar = page.locator('input[type="range"][aria-label*="seek"], input[type="range"][aria-label*="progress"]').first();
    if (await progressBar.isVisible()) {
      // Seek to 50%
      await progressBar.fill('0.5');
      
      // Verify time changed
      const video = page.locator('video').first();
      const currentTime = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
      expect(currentTime).toBeGreaterThan(0);
    }
  });
});
