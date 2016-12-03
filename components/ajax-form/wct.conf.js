module.exports = {
    plugins: {
        local: {
            disabled: true,
            browsers: ['chrome', 'safari']
        },
        sauce: {
            disabled: true,
            browsers:
                [
                    {
                        "browserName": "internet explorer",
                        "platform":    "Windows 8.1",
                        "version":     "11"
                    },
                    {
                        "browserName": "internet explorer",
                        "platform":    "Windows 7",
                        "version":     "10"
                    },

                    //{
                    //    "browserName": "chrome",
                    //    "platform":    "OS X 10.10",
                    //    "version":     "canary"
                    //},
                    {
                        "browserName": "chrome",
                        "platform":    "Windows 8.1",
                        "version":     ""
                    },
                    {
                        "browserName": "chrome",
                        "platform":    "Linux",
                        "version":     ""
                    },
                    {
                        "browserName": "firefox",
                        "platform":    "OS X 10.9",
                        "version":     "40"
                    },
                    // {
                    //     "browserName": "firefox",
                    //     "platform":    "Windows 8.1",
                    //     "version":     ""
                    // },
                    // {
                    //    "browserName": "firefox",
                    //    "platform":    "Linux",
                    //    "version":     "39"
                    // },
                    //
                    //{
                    //    "browserName": "safari",
                    //    "platform":    "OS X 10.10",
                    //    "version":     "8"
                    //},
                    {
                        "browserName": "safari",
                        "platform":    "OS X 10.9",
                        "version":     "7"
                    }
                ]
        }
    }
};
