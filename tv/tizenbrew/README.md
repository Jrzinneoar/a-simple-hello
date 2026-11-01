# NOIR PLAY for TizenBrew

This is an application-module launcher, not a native Samsung WGT package. Its package metadata follows https://github.com/reisxd/TizenBrew/blob/main/docs/MODULES.md.

## Installation prerequisites

1. Publish the NOIR PLAY website to an HTTPS address. Preview URLs are not production deployment targets.
2. Package/publish this directory as an npm module in your own npm account, following the TizenBrew module documentation; no npm publication has been performed by Lovable.
3. Install TizenBrew and add that published npm package in its module manager.
4. Open NOIR PLAY and enter the published website address. The launcher redirects with `?tv=1`, activating directional focus navigation.

The remote wrapper redirect is a web workaround and is not verified on hardware. TizenBrew requires Tizen 3.0+; that does not guarantee React 19, Tailwind v4 or the external iframe player works in older TV browsers. Validate on the actual TV. Arrow keys navigate site controls, Enter activates them, and Back returns through site history. Controls within a cross-origin player belong to that provider and cannot be changed by the site.

Playback progress: native MP4/HLS playback saves exact time on the device. The external player does not expose a verified progress API; the app remembers the selected episode and allows an explicit watched mark, but cannot promise exact time resume there.