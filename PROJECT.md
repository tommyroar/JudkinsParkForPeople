Act as a Senior Frontend Engineer and Urban Planner. Create a React Single Page Application (SPA) using Vite, Tailwind CSS, and Mapbox (react-map-gl) to deliver a "Mission Page and Scrollytelling Story" for the Judkins Park pedestrian safety proposal.

### Project Vision:
Transform the proposal into an immersive scrollytelling experience that guides the user through the transition of 20th Ave S from a car-centric cut-through to a "Transit Portal" for the new Judkins Park Light Rail Station (opening March 2026).

### Core Requirements:

1. **Scrollytelling Architecture:**
   - **Background:** A full-screen Mapbox map (`react-map-gl`) that remains fixed.
   - **Foreground:** A scrollable container with narrative "cards" (chapters) that overlay the map.
   - **Transitions:** As the user scrolls into each card, the map should `flyTo` specific coordinates, zoom levels, and pitches to highlight relevant features.

2. **Narrative Chapters (Scrollytelling Stages):**
   - **Stage 1: The Mission.** Title: "20th Ave S Transit Portal 2026". Center on the neighborhood. Text: The shift from car-centric cut-through to transit-first hub.
   - **Stage 2: The Gateway.** Focus on 20th & S Jackson St. Highlight the start of the 20th Ave S corridor.
   - **Stage 3: School Safety.** Zoom to 20th & Weller (HAWK Signal). Popup: "Proposed HAWK Signal (School Safety - Hamlin Robinson)".
   - **Stage 4: Station Access.** Zoom to 21st & Judkins (HAWK Signal). Highlight proximity to the Light Rail Station (opening March 28, 2026).
   - **Stage 5: Flow Control.** Zoom to 20th & Dearborn (Modern Roundabout). Popup: "Proposed Modern Roundabout (Uphill Flow/Event Management)".
   - **Stage 6: Park Integration.** Zoom to 20th & Charles (Modern Roundabout). Popup: "Proposed Modern Roundabout (Park Access/Umoja Fest)".
   - **Stage 7: The Blueprint.** Final zoom out showing the entire corridor (S Jackson to S Grand) with the proposed polyline and all markers.

3. **Interactive Map Features:**
   - **Styling:** Use a high-quality Mapbox style (e.g., Mapbox Streets or a custom light/dark theme).
   - **Polyline:** Draw a highlighted path along 20th Ave S.
   - **Custom Markers:** Use Lucide-React icons inside Mapbox `Marker` components (e.g., `Circle`, `ShieldCheck`, `Navigation`).
   - **Interactive Buffers:** (Reference intentcity #1) Implement a click/tap buffer around markers for easier interaction on mobile.

4. **UI/UX Styling (Tailwind CSS):**
   - **"Transit-Modern" Aesthetic:** Deep blues (`#1e3a8a`), safety greens, and crisp whites.
   - **Narrative Cards:** Glassmorphism effect (semi-transparent backgrounds with blur) for the scrollytelling cards.
   - **Responsive Design:** Side-aligned cards on desktop, full-width overlays on mobile.
   - **Legend:** A minimalist floating legend explaining HAWK signals vs. Roundabouts.

5. **Technical Constraints & Setup:**
   - **Framework:** React 19, Vite.
   - **Mapping:** `react-map-gl` / `mapbox-gl`.
   - **Icons:** `lucide-react`.
   - **Content:** Use `react-markdown` for the card descriptions.
   - **Animation:** Use `framer-motion` for card entry/exit transitions.
   - **Key Management:** Follow the project convention for Mapbox keys:
     - The access token should be managed via `VITE_MAPBOX_ACCESS_TOKEN` in a `.env` file.
     - Use the centralized `~/.mapbox/credentials` via the `setup_mapbox.cjs` script to initialize the environment.
     - Ensure `mapbox.key` and `.env` are added to `.gitignore`.
