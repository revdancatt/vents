A couple of weeks ago Bruce a.k.a. @Studio Yorktown [https://www.fxhash.xyz/u/Studio%20Yorktown] released "Studio Yorktown Color Town Hall" [https://studioyorktown.github.io/coloryorktownhall/] a library of colour palettes, free to use.

Sometimes bringing a project into existence is hard work, nothing seems quite right. Othertimes everything hits you just right. It was several things, I'd been listening to the music of Antarctica (again) their album 3.377083333333333 [https://open.spotify.com/album/7jb9ZRdjuBA31Nx2wA7XJX?si=XT0JXdRnSX61OUUP1pjQJQ] has always stuck with me, at the same time I'd been studying Brutalism for my own project, which, as well as recently revisiting Tyler Hobbs' project Wall [https://tylerxhobbs.com/works/2022/wall]. I was on an architectural kick.

[Album cover, Brutalism, Wall]

I was thinking in terms of cold metal, sharpe edges and texture, but all in the scope of my current project. But when I saw Bruce's webpage with all the colours, the soft warm ones, and it being called a "Town Hall", everything all came together pretty much full formed.

[webpage]

"You know what this Town Hall needs?" I asked no-one in particular, "Vents!". Besides, what's more Christmassy than a good old vent?

[Die Hard]

The process itself was very quick, I'll cover some of the itteration here, and then the bits I decided to leave out.

# Itteration

As I already knew what I had in mind, a grid with "vents" in, it was very quick and easy to get started. Grab palettes from Bruce's file and start making squares.

[image]

I then quickly added the gradients, and inward vents.

[image]

Next came the subdivisions and vent sizes. Often with something like this you'd use recursion, in that you'd make a tile, check to see if it was being subdivided and pass each quarter back into the same function which decided if it should be subdivided or not.

This method is great for breaking up shapes into lots of smaller shapes, but also wildly tricky and annoying to debug. If you're outputting data to the console you kinda get too much of it, and if you're stepping in, through and out of code it can take a long time to get to the part you want to debug.

As this was only going to be subdivided twice I decided to just generally "hard-code" it in a nest of loops and if statements. If I'd gone any future levels I'd probably have to rethink that.

[image]

The penultimate step was to add levels and a fun "Wireframe" mode. Originally the wireframe was going to be everything, but after a little playing I decided I liked the solid edges and vents more.

[image]

The last thing to do was tune the outputs and the colour palettes. I do this by adding some code at the end of the draw step, which saves the output image, with the hash in the file name. This does two things. It allows me to plug the hash back in to iron out any problem outputs I'm seeing.

The other thing it does is allow me to run them through a script that turns it into a large contact sheet giving me an overview of the output as a whole set. These images have 625 in, and I'm aiming for 600, so this is pretty good.

I decided that as much as I love Bruce's palettes there's just no need to use all 83 of them! The selection of palettes is great, you can pick any and know they'll work with the others. Perfect for throwing into a project when you're starting. For me there were too many similar cream/brown output. Even though the palettes were different, how I'm using them in this project didn't give them enough unique identity. So I kept pulling them out and re-running groups of 625 outputs until I was happy.

I also threw in a few of my own palettes. You can see the final results in these two images, the first random and the second a _different_ set of 625 which are grouped by palette.

[image]

# The things left out

There's three things I was thinking about adding and then rejected. The first was circular vents, right from the start I planned on possibly having the round vents on any "tile" that hadn't been subdivided up.

[Image]

The second was occasionally adding windows instead of vents. The layout pattern of having vertical columns was inspired by my trip to Hong Kong where I gathered a number of photos like this.

[Hong Kong]

The final one was tiny rivets in the corner of each "tile".

I rejected them because I decided that any one of them took the design away from abstract and closer to figurative. The project is called "Vents", but it could just have easily been called "Switches" or "Post-it Notes". The moment I started adding even more in flipped it from one type of project to the other, and I wanted this one to stay firmly in the abstract camp.
