import pyglet
ag_file = "love.gif"
animation = pyglet.resource.animation(ag_file)
sprite = pyglet.sprite.Sprite(animation)
window = pyglet.window.Window(width=640,height=400)
@window.event
def on_draw():
    window.clear()
    sprite.draw()

pyglet.app.run()
