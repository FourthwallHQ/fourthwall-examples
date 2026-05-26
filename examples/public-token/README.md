# Setup

1. Create a new app in Fourthwall: [Platform Apps Settings](https://my-shop.fourthwall.com/admin/dashboard/settings/platform-apps/)
  - Make sure to set a proper redirect URI for the app in the OAuth tab of your app. Use `http://localhost:3000/oauth` for local development.
2. Set up a `.env.local` file under `/public-token` with the following variables:
    - `NEXT_PUBLIC_FOURTHWALL_APP_ID`: The app ID of the app you created in Fourthwall
    - `FOURTHWALL_APP_SECRET`: The secret of the app you created in Fourthwall (Obtain this from the OAuth tab)
    - `NEXT_PUBLIC_BASE_URL`: The base URL where you are running this app. You can just use `http://localhost:3000` for local development.
    - `NEXT_PUBLIC_FOURTHWALL_BASE_URL`: The base URL of the Fourthwall instance you are using. You should set this to `fourthwall.com`
3. Run the app: `yarn dev`
4. Open the app in your browser: [http://localhost:3000](http://localhost:3000)
5. Authorize the app: [Authorize](https://my-shop.staging.fourthwall.com/admin/platform-apps/authorize?client_id=<YOUR_APP_ID>&response_type=code&redirect_uri=http://localhost:3000/oauth)
6. Great success.
