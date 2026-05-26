Prompt

Context and Role

Your'e fullstack Freelance Developer, developing apps over 2 years speacialising in  showcasing modern beautiful web designs with specific touch. The website must use a simple lightweight and user friendly UI with button and box animations.

The architecture should also be able to handle large userbase (~1000 at any instance of day). The backend should be highly optimsed for performance and efficiency reducing DB bills without compromising on user experience.


Objective:


Develop a FullStack Application using NextJS :
	
	Implement a infinite white drawing board with movement across both axis.
	Must Contain different drawing tools inside a toolbar for an interactive usage.
	Use browser(IP) based user indentification for less onboarding resistance 
	Give a sharable board links(using a url) easing collaboration.
	Display active users count along with their names.


Layout Requirements:

The website must feature :
	
	An Infinity drawing window which can be used to doodle things without any canvas limits.
	A Toolbar section at the Top Mid Section providing access to various kind of drawing tools.
	Active users number on the top right.
	Board shareable button on bottom right.
	Left side should have a UI Box to pick colors , adjust marker thickness,choose shape type(Solid , wireframe) , Opacity etc.
	A button consisting "!" as logo which can be used for bug reporting, with mentioning developers email.

The layout must be :
	Fully responsive for different screens (Desktop, Tablet , Phones).
	High Performing UI without any lags or jitter.
	
UI Requirements:

Animations:
	Implement hover based animations on every section (bouncy effect).
	Micro-interactions on every element.
	Fade-in and Fade-out on the left UI box.
	Use low - performance hungry methods(should work on mid end devices too).
	Use super - smooth transitions whenever a UI change happens.

Fields Requirements:
On landing user must :
	Enter their display name (Mandatory Field).
	Enter email (Optional Field).
	validate email before saving to DB.


Backend and Architecture Requirements:

Security :
	IP based user identification.
	Save IP  , display name , email and TimeStamp into the database.
	store Credentials using environment variables (.env).
	Prevent DDos attacks using rate limiting.



Error Handling:

	Handle frontend data using zod validations.
	Respond with appropriate status codes to frontend.
	Structured and Formatted error responses following the conventions save logs in a LOG folder.
	Every hour a new file will be created for saving logs. 
	save all the initializing and error logs.


Data Processing Requirements:

	Validate email format using Zod.
	Validate and sanitize all user inputs (display name, board data) to prevent XSS attacks.
	Compress drawing stroke data before storing/transmitting to optimize database and network performance.
	Implement efficient real-time data synchronization for collaborative drawing using Socket.io events.
	Validate drawing coordinates and tool parameters (brush size, color, opacity) against allowed ranges.
	Cache active board metadata and user presence data to reduce database queries.
	Implement data pagination for large boards and drawing histories.
	Archive or soft-delete old drawing sessions after a configurable period.
	Batch process and validate incoming drawing events to prevent data overflow.
	Log all failed validations and data anomalies for debugging and security monitoring.


Tech Stack :

Frameworks:

BACKEND:
	NextJS: Full-stack React framework with built-in API routes especializing server-side rendering for better performance and reduced server load.
	Socket.io: Real-time communication protocol library for real collaborative drawing and live user presence updates.
	Prisma: Modern industry tested type-safe ORM for PostgreSQL with query optimization and efficient data handling, reducing database costs and improving response times.
	dotenv: Secure environment variable management for storing sensitive credentials (API keys, database URLs) without exposing them in source code.
	zod: TypeScript-first schema validation library ensuring data integrity across frontend and backend, preventing invalid data from reaching the database.
	Rate-limiter (express-rate-limit): DDoS protection middleware to throttle requests and prevent abuse from single IP addresses.
	
FRONTEND : 
	Lucid React: Lightweight, modern looking icon library with minimal bundle size, designed for responsive UI icons.
	Tailwind CSS: Popular CSS framework allowing responsive UI development with consistent styling.
	Framer Motion: High-performance animation library optimized for smooth micro-interactions and transitions, ensuring jitter-free experience even on mid-range devices.