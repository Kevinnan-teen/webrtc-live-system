# coding:utf-8


import numpy as np
import matplotlib.pyplot as plt
from matplotlib.pyplot import MultipleLocator

# l1=plt.plot(x1,y1,'r--',label='type1')
# l2=plt.plot(x2,y2,'g--',label='type2')
# l3=plt.plot(x3,y3,'b--',label='type3')
# plt.plot(x1,y1,'ro-',x2,y2,'g+-',x3,y3,'b^-')
# plt.title('The Lasers in Three Conditions')
# plt.xlabel('row')
# plt.ylabel('column')
# plt.legend()
# plt.show()

emit_rate = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
cpu_usage = [20, 27, 44, 60, 72, 83, 89, 95, 99, 100]
plt.plot(emit_rate, cpu_usage, 'ro-', label='')
# plt.plot(emit_rate, cpu_usage, 'b^-', label='')
# plt.plot(emit_rate, cpu_usage, 'g+-', label='')
x_major_locator=MultipleLocator(100)
ax=plt.gca()
#ax为两条坐标轴的实例
ax.xaxis.set_major_locator(x_major_locator)
plt.xlim(0,1050)
plt.title('socket.io benckmark')
plt.xlabel('msg/sec')
plt.ylabel('cpu usage(%)')
plt.show()
