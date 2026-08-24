import { NextResponse } from "next/server";

export async function GET() {
  const facebookAppId = process.env.FACEBOOK_CLIENT_ID;
  const hasAppSecret = Boolean(process.env.FACEBOOK_CLIENT_SECRET);
  const instagramToken = Boolean(process.env.INSTAGRAM_PAGE_ACCESS_TOKEN);

  const readyForFacebook = Boolean(facebookAppId && hasAppSecret);
  const readyForInstagram = readyForFacebook || instagramToken;

  return NextResponse.json({
    facebook: {
      ready: readyForFacebook,
      configured: Boolean(facebookAppId),
    },
    instagram: {
      ready: readyForInstagram,
      bypassActive: instagramToken,
    },
    status: readyForFacebook && readyForInstagram ? "operational" : "degraded",
  });
}
