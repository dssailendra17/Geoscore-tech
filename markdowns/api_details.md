1. Brand.dev
curl -X GET "https://api.brand.dev/v1/brand/retrieve?domain=brand.dev" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer brand_802dfd31cbd1482fa0171f6dd1022440"
Output:
{
  "status": "ok",
  "brand": {
    "domain": "brand.dev",
    "title": "Brand.dev",
    "description": "Brand.dev is a cutting-edge API solution that provides instant access to company logos, brand colors, and fonts. By simply inputting a domain, users can retrieve the desired visual assets in seconds, making it a trusted tool for over 1000 developers.",
    "slogan": "Instantly access logos, colors, and fonts from any domain with brand.dev",
    "colors": [
      {
        "hex": "#bc6cf4",
        "name": "Queer Purple"
      },
      {
        "hex": "#995bc7",
        "name": "Morado Purple"
      },
      {
        "hex": "#43235c",
        "name": "Galactic Wonder"
      }
    ],
    "logos": [
      {
        "url": "https://media.brand.dev/5b847ca6-6c8a-4961-bdd0-b5a8f6a13d54.png",
        "mode": "has_opaque_background",
        "colors": [
          {
            "hex": "#995bc7",
            "name": "Morado Purple"
          },
          {
            "hex": "#43235c",
            "name": "Galactic Wonder"
          },
          {
            "hex": "#140c1a",
            "name": "Back In Black"
          }
        ],
        "resolution": {
          "width": 256,
          "height": 128,
          "aspect_ratio": 2
        },
        "type": "logo"
      },
      {
        "url": "https://media.brand.dev/ceb1dcf0-1176-40c4-afec-e18da3f2b4e3.png",
        "mode": "dark",
        "colors": [
          {
            "hex": "#bc6cf4",
            "name": "Queer Purple"
          }
        ],
        "resolution": {
          "width": 180,
          "height": 180,
          "aspect_ratio": 1
        },
        "type": "icon"
      }
    ],
    "backdrops": [
      {
        "url": "https://media.brand.dev/ab1b6fa3-dc65-4bb4-8e26-7ec0f5a7cd1c.jpg",
        "colors": [
          {
            "hex": "#ba74ef",
            "name": "Illicit Purple"
          },
          {
            "hex": "#e8dbf2",
            "name": "Lingering Lilac"
          },
          {
            "hex": "#130f15",
            "name": "Kettle Black"
          }
        ],
        "resolution": {
          "width": 1200,
          "height": 630,
          "aspect_ratio": 1.9
        }
      },
      {
        "url": "https://media.brand.dev/5221dcf0-1437-4b59-8539-bab3edfc51e0.png",
        "colors": [
          {
            "hex": "#ab7bcb",
            "name": "Wisteria"
          },
          {
            "hex": "#323b3e",
            "name": "Old School"
          },
          {
            "hex": "#dfe4de",
            "name": "Whitecap Foam"
          }
        ],
        "resolution": {
          "width": 1200,
          "height": 627,
          "aspect_ratio": 1.91
        }
      }
    ],
    "address": {
      "city": "Wilmington",
      "country": "United States",
      "country_code": "US",
      "state_province": "Delaware",
      "state_code": "DE"
    },
    "socials": [
      {
        "type": "linkedin",
        "url": "https://linkedin.com/company/branddev"
      },
      {
        "type": "x",
        "url": "https://x.com/get_brand_dev"
      }
    ],
    "email": "yahia@brand.dev",
    "is_nsfw": false,
    "industries": {
      "eic": [
        {
          "industry": "Technology",
          "subindustry": "Developer Tools & APIs"
        }
      ]
    },
    "links": {
      "contact": null,
      "careers": "https://www.brand.dev/blog/myrnjobs-streamlines-job-board-integration-with-brand-dev",
      "terms": "https://www.brand.dev/term",
      "privacy": "https://www.brand.dev/privacy",
      "blog": "https://www.brand.dev/blog",
      "login": null,
      "signup": null,
      "pricing": "https://www.brand.dev/pricing"
    }
  },
  "code": 200
}