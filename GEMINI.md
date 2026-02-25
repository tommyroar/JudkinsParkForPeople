# JudkinsParkForPeople

## Directory Overview
This project is a planning and advocacy hub for pedestrian safety and traffic calming improvements in the Judkins Park neighborhood of Seattle. It specifically targets the transition of the area around the upcoming Judkins Park Light Rail Station (opening March 2026) from a car-centric cut-through into a transit-first hub.

The repository currently serves as a specification and blueprint for a visualization tool designed to showcase proposed infrastructure changes like HAWK signals, modern roundabouts, and bulbouts.

## Key Files
- **`PROJECT.md`**: The technical blueprint for a **Mapbox-powered Scrollytelling Story**. It outlines the transition from Leaflet to `react-map-gl`, aligning with the **intentcity** tech stack. It specifies a narrative-driven UI with "Transit-Modern" aesthetics, Mapbox `flyTo` transitions, and glassmorphism narrative cards.
- **`README.md`**: High-level goal: proposing pedestrian improvements for Judkins Park.
- **`LICENSE`**: MIT License.
- **`.gitignore`**: Configured for a React/Vite/Mapbox development environment.

## Usage
- **Development Blueprint**: Use `PROJECT.md` to initialize the project using React 19, Vite, Tailwind CSS, and Mapbox.
- **Scrollytelling Engine**: The project is designed to use scroll-triggered map transitions to tell the story of the 20th Ave S "Transit Portal".
- **Interaction Model**: Leverages advanced mapping patterns (like the click-buffer from intentcity #1) to ensure high accessibility and mobile-friendliness.
