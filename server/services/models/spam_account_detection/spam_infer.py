import joblib
import numpy as np

scaler = joblib.load("models/scaler.pkl")
model = joblib.load("models/logistic_regression_model.pkl")
columns_to_standardize = [2, 3, 4, 7, 8]
input = np.array(
    [
        1.0000e00,
        0.0000e00,
        2.3700e02,
        2.7394e04,
        5.4200e02,
        0.0000e00,
        0.0000e00,
        8.4280e00,
        1.3660e03,
    ]
)
# spam_test_input = {
#     "features": ['default_profile', 'default_profile_image', 'favourites_count', 'followers_count','friends_count',	'geo_enabled','verified','average_tweets_per_day','account_age_days'],
#     "regular": [1.000e+00, 0.000e+00, 8.433e+03, 5.170e+02, 6.330e+02, 1.000e+00,
#         0.000e+00, 8.890e-01, 1.489e+03],
#     "spam": [1.0000e+00, 0.0000e+00, 2.3700e+02, 2.7394e+04, 5.4200e+02,
#         0.0000e+00, 0.0000e+00, 8.4280e+00, 1.3660e+03]
# }
spam_test_input = {
    "features": [
        "default_profile",
        "default_profile_image",
        "favourites_count",
        "followers_count",
        "friends_count",
        "geo_enabled",
        "verified",
        "average_tweets_per_day",
        "account_age_days",
    ],
    "regular": [1, 0, 8433, 517, 633, 1, 0, 0.889, 1489],
    "spam": [1, 0, 237, 27394, 542, 0, 0, 8.428, 1366],
}
# default_profile	default_profile_image	favourites_count	followers_count	friends_count	geo_enabled	verified	average_tweets_per_day	account_age_days	account_type


def spam_forward(input):
    input = np.array([input])
    data_to_transform = input[:, columns_to_standardize]
    transformed_data = scaler.transform(data_to_transform)
    standardized_input = input.copy()
    standardized_input[:, columns_to_standardize] = transformed_data

    predictions = model.predict_proba(standardized_input)
    spam_pred = predictions[0][1]

    return spam_pred


if __name__ == "__main__":
    print(spam_forward(spam_test_input["spam"]))
