# coding:utf-8


import numpy as np
import matplotlib.pyplot as plt
from matplotlib.pyplot import MultipleLocator


rtmp_push = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]
cpu_usage = [17, 30, 42, 54, 65, 76, 83, 91, 97.3, 99.7, 100, 100]
mem_usage = [8.1, 8.3, 8.5, 8.7, 9.5, 11.4, 13.3, 15.2, 17.2, 19, 19, 19.1]

rtmp_pull = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]
cpu_usage_2 = [10.7, 18.9, 28.2, 40.2, 50.5, 62.8, 69.8, 88, 99, 100, 100, 100]
mem_usage_2 = [8.3, 8.4, 8.8, 9.0, 9.0, 11, 11.4, 15.1, 15.2, 18.3, 18.2, 18.3]
# plt.plot(rtmp_pull, cpu_usage_2, 'ro-', label='')
plt.plot(rtmp_push, mem_usage, 'ro-', label='')
# plt.plot(rtmp_pull, cpu_usage_2, 'g+-', label='')
x_major_locator=MultipleLocator(100)
y_major_locator=MultipleLocator(10)
ax=plt.gca()
#ax为两条坐标轴的实例
ax.xaxis.set_major_locator(x_major_locator)
# ax.yaxis.set_major_locator(y_major_locator)

plt.xlim(0,1250)
# plt.title('CPU Usage of RTMP PULL')
# plt.xlabel('number of steam pull')
# plt.ylabel('cpu usage(%)')
plt.title('Memory Usage of RTMP PULL')
plt.xlabel('number of steam pull')
plt.ylabel('memory usage(%)')
plt.show()
