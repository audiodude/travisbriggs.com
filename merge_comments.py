import sqlite3

from contextlib import closing

left = sqlite3.connect("comments.sqlite3.left")
right = sqlite3.connect("comments.sqlite3.right")

left_slugs = set()
right_slugs = set()
with closing(left.cursor()) as left_cursor, closing(right.cursor()) as right_cursor:
  left_cursor.execute("SELECT id, page_slug FROM comments")
  for id, slug in left_cursor.fetchall():
    left_slugs.add((id, slug))

  right_cursor.execute("SELECT id, page_slug FROM comments")
  for id, slug in right_cursor.fetchall():
    right_slugs.add((id, slug))

print('In left but not in right:')
print(left_slugs - right_slugs)
print()
print('In right but not in left:')
print(right_slugs - left_slugs)