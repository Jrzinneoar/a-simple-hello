<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared navigation and footer in the root layout; hide the footer during playback to keep the viewing surface clear.
- Keep TV directional navigation in a browser-only effect, enabled by Tizen user-agent or tv=1; preserve normal desktop keyboard behavior.
- Use tv/tizenbrew as a standalone hosted-site launcher package, not a native build; actual installation requires a published site, module distribution and hardware validation.
- Never infer iframe playback time from elapsed wall-clock time: only direct video sources provide verified timestamps; external embeds retain episode selection and explicit completion locally.
- Embedded players use an optional sandbox (no allow-popups) as the ad blocker, user-toggleable and persisted locally, because some providers refuse sandboxed frames.
