import time


class Cache:
    def __init__(self, ttl=300):
        print("Cache initialized")
        self.cache = {}
        self.ttl = ttl

    def set(self, key, value):
        self.cache[key] = {"value": value, "timestamp": time.time()}

    def get(self, key):
        if key in self.cache:
            item = self.cache[key]
            if time.time() - item["timestamp"] < self.ttl:
                return item["value"]
            else:
                del self.cache[key]
        return None

    def clear(self):
        self.cache.clear()
