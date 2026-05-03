import random
from math import sin, cos, pi, log
from tkinter import *

# Constants
CANVAS_WIDTH = 640
CANVAS_HEIGHT = 640
CANVAS_CENTER_X = CANVAS_WIDTH / 2
CANVAS_CENTER_Y = CANVAS_HEIGHT / 2
IMAGE_ENLARGE = 11
INNER_HEART_COLOR = "pink"  # Color for the inner heart
OUTER_HEART_COLOR = ""  # Color for the outer heart
SCATTER_BETA = 0.15
SHRINK_RATIO = 15
CURVE_RATIO = 10
FRAME_DELAY = 160
NUM_POINTS = 2000
NUM_HALO_POINTS = 3000

class HeartParameters:
    def __init__(self):
        self.points = set()
        self.edge_diffusion_points = set()
        self.center_diffusion_points = set()
        self.all_points = {}

# Heart function
def heart_function(t, shrink_ratio=IMAGE_ENLARGE):
    x = 16 * (sin(t) ** 3)
    y = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t))
    x *= shrink_ratio
    y *= shrink_ratio
    x += CANVAS_CENTER_X
    y += CANVAS_CENTER_Y
    return int(x), int(y)

# Scatter points
def scatter_points(x, y, beta=SCATTER_BETA):
    ratio_x = -beta * log(random.random())
    ratio_y = -beta * log(random.random())
    dx = ratio_x * (x - CANVAS_CENTER_X)
    dy = ratio_y * (y - CANVAS_CENTER_Y)
    return x - dx, y - dy

# Shrink points
def shrink_points(x, y, ratio):
    force = -1 / (((x - CANVAS_CENTER_X) ** 2 + (y - CANVAS_CENTER_Y) ** 2) ** 0.6)
    dx = ratio * force * (x - CANVAS_CENTER_X)
    dy = ratio * force * (y - CANVAS_CENTER_Y)
    return x - dx, y - dy

# Curve function
def curve(p):
    return 2 * (3 * sin(4 * p)) / (2 * pi)

# Heart class
class Heart:
    def __init__(self, generate_frame=20):
        self.parameters = HeartParameters()
        self.generate_frame = generate_frame
        self.build(NUM_POINTS)
        for frame in range(generate_frame):
            self.calc(frame)

    def build(self, number):
        for _ in range(number):
            t = random.uniform(0, 2 * pi)
            x, y = heart_function(t)
            self.parameters.points.add((x, y))
        for _x, _y in list(self.parameters.points):
            for _ in range(3):
                x, y = scatter_points(_x, _y)
                self.parameters.edge_diffusion_points.add((x, y))
        point_list = list(self.parameters.points)
        for _ in range(NUM_HALO_POINTS):
            x, y = random.choice(point_list)
            x, y = scatter_points(x, y, 0.17)
            self.parameters.center_diffusion_points.add((x, y))

    @staticmethod
    def calc_position(x, y, ratio):
        force = 1 / (((x - CANVAS_CENTER_X) ** 2 + (y - CANVAS_CENTER_Y) ** 2) ** 0.520)
        dx = ratio * force * (x - CANVAS_CENTER_X) + random.randint(-1, 1)
        dy = ratio * force * (y - CANVAS_CENTER_Y) + random.randint(-1, 1)
        return x - dx, y - dy

    def calc(self, generate_frame):
        ratio = CURVE_RATIO * curve(generate_frame / 10 * pi)
        halo_radius = int(4 + 6 * (1 + curve(generate_frame / 10 * pi)))
        halo_number = int(3000 + 4000 * abs(curve(generate_frame / 10 * pi) ** 2))
        all_points = []
        heart_halo_point = set()
        for _ in range(halo_number):
            t = random.uniform(0, 2 * pi)
            x, y = heart_function(t, shrink_ratio=SHRINK_RATIO)
            x, y = shrink_points(x, y, halo_radius)
            if (x, y) not in heart_halo_point:
                heart_halo_point.add((x, y))
                x += random.randint(-14, 14)
                y += random.randint(-14, 14)
                size = random.choice((1, 2, 2))
                all_points.append((x, y, size))
        for x, y in self.parameters.points:
            x, y = self.calc_position(x, y, ratio)
            size = random.randint(1, 3)
            all_points.append((x, y, size))
        for x, y in self.parameters.edge_diffusion_points:
            x, y = self.calc_position(x, y, ratio)
            size = random.randint(1, 2)
            all_points.append((x, y, size))
        for x, y in self.parameters.center_diffusion_points:
            x, y = self.calc_position(x, y, ratio)
            size = random.randint(1, 2)
            all_points.append((x, y, size))
        self.parameters.all_points[generate_frame] = all_points

    def render(self, render_canvas, render_frame):
        for x, y, size in self.parameters.all_points[render_frame % self.generate_frame]:
            if size == 2:
                render_canvas.create_rectangle(x, y, x + size, y + size, width=0, fill=INNER_HEART_COLOR)
            else:
                render_canvas.create_rectangle(x, y, x + size, y + size, width=0, fill=OUTER_HEART_COLOR)

def draw(main: Tk, render_canvas: Canvas, render_heart: Heart, render_frame=0):
    render_canvas.delete('all')
    render_heart.render(render_canvas, render_frame)
    main.after(FRAME_DELAY, draw, main, render_canvas, render_heart, render_frame + 1)

if __name__ == '__main__':
    root = Tk()
    root.title('')
    canvas = Canvas(root, bg='black', height=CANVAS_HEIGHT, width=CANVAS_WIDTH)
    canvas.pack()
    heart = Heart()
    draw(root, canvas, heart)
    root.mainloop()

