# Media

Screenshots and the demo GIF are captured from the real app running fictional sample data. Nothing is mocked up.

To regenerate them:

```sh
npm run build
npx vite preview --port 4173 &
npx tsx scripts/capture-media.ts
ffmpeg -y -i docs/media/demo.webm \
  -vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  docs/media/demo.gif
```
