import datetime

f = open("data.csv", "r", errors="ignore")
fout = open("processed_data.csv", "w+")
fout.truncate(0)
for i, line in enumerate(f):
    if i == 0:
        fout.write(line)
        continue
    cols = line.split(',')
    date = datetime.datetime.strptime(cols[-2], '%Y-%m-%d')
    if i % 1000 == 0:
        print(i)
    if date.weekday() == 0 and int(cols[0]) <= 10:
        fout.write(line)
    i += 1