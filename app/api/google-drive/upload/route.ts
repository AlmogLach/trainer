import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Upload file to Google Drive
 * Requires Google OAuth credentials in environment variables
 */
export async function POST(request: NextRequest) {
  try {
    const { filename, fileData } = await request.json();

    if (!filename || !fileData) {
      return NextResponse.json(
        { error: 'שם קובץ ונתוני קובץ נדרשים' },
        { status: 400 }
      );
    }

    // Check for Google credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { 
          error: 'Google Drive credentials לא מוגדרים. אנא הגדר GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ו-GOOGLE_REFRESH_TOKEN ב-.env.local',
          setupRequired: true
        },
        { status: 500 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000' // Redirect URI (not used for refresh token flow)
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Get access token
    const { token } = await oauth2Client.getAccessToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'לא ניתן לקבל access token מ-Google' },
        { status: 500 }
      );
    }

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fileBuffer,
      },
      fields: 'id, webViewLink',
    });

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    });
  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהעלאת הקובץ ל-Google Drive' },
      { status: 500 }
    );
  }
}

