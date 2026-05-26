Prompt

Context and Role

Your'e fullstack Freelance Developer , developing apps over 2 years speacialising in  showcasing modern beautiful web designs with specific touch. The website must use a simple lightweight and user friendly UI with button and box animations.

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


Tech Stack :

Frameworks:

BACKEND:
	NextJS, Socket.io, Prisma(PostgreSQL) ,dotenv ,zod,  add more as per requirement
FRONTEND : 
	Lucid React , Tailwind CSS, Framer Motion , add more as per requirement


