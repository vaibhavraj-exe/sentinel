import re
from inflect import engine

blacklisted_words = {
    'whole': ['drug'],
    'starting': ['drug'],
    'ending': ['drug'],
    'subword': ['drug']
}

def check_blacklisted_words(text):
    result = {'harmful': False, 'sentence': text, 'filters': [], 'flagged_words': []}
    plural_engine = engine()
    
    for word in blacklisted_words['whole']:
        pattern = re.compile(r'\b{}\b'.format(re.escape(word)), re.IGNORECASE)
        if pattern.search(text):
            result['harmful'] = True
            result['filters'].append('whole')
            result['flagged_words'].append(word)
    
    for word in blacklisted_words['ending']:
        pattern = re.compile(r'{}\W*$'.format(re.escape(word)), re.IGNORECASE)
        if pattern.search(text):
            result['harmful'] = True
            result['filters'].append('ending')
            result['flagged_words'].append(word)
    
    for word in blacklisted_words['starting']:
        pattern = re.compile(r'^\W*{}'.format(re.escape(word)), re.IGNORECASE)
        if pattern.search(text):
            result['harmful'] = True
            result['filters'].append('starting')
            result['flagged_words'].append(word)
    
    for word in blacklisted_words['subword']:
        pattern = re.compile(r'\W+{}\W+'.format(re.escape(word)), re.IGNORECASE)
        if pattern.search(text):
            result['harmful'] = True
            result['filters'].append('subword')
            result['flagged_words'].append(word)
    
    plural_word = plural_engine.plural(word)
    if plural_word != word:
        pattern = re.compile(r'\b{}\b'.format(re.escape(plural_word)), re.IGNORECASE)
        if pattern.search(text):
            result['harmful'] = True
            result['filters'].append('whole')
            result['flagged_words'].append(plural_word)
    
    return result

text = "I want drugs from you"
res = check_blacklisted_words(text)
print(res)
