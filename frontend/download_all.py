import urllib.request
import os

screens = [
    ("00d5436753c449fb9ee053fc9d0aaccb", 
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjU5NzA5NWMwNDRmNWQzYzcwMDNlMWJkEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086", 
     "https://lh3.googleusercontent.com/aida/AP1WRLs-AipczuCMKeeVq0TvU5OMETS0VjFQR39EIGckQHwNKDZH5lTKkzFc2giJnYuS1Dx4c4GKvdAcXk6x0DpPFKO-tbelYDCifzLxiQIt_h6AsWQu_Z4J17M1aIMiMAPlX6jMY07-6e75fGCXPAdrHqZXueEZCREXXDEU1rnPqxR3IomCkJ78O6IUkinazxlYiLPkXen6zUlaaZo0_TMOIah8YZl9_NzRiJBWOZPksolGqWo_Gb_KSBLXz6Rv=w2560"),
    ("11d7c532d2d041daaa1c509571af1943",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2MTQ5Y2ZiYTQwNWYxMjAxYWU0MDlmZGVjEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLuKJAJF5_cVz-vCfnJTk7FGh68urQGBG2FJBLuo1gF1fiWJO8rgpgH7mp5pOHFvG0KC9iy7HNtyaJDeQY-suHryo7x_FDmswBMasMGFqqo715Xw5hzXnhi4dUeD8KgIfKMjQPNOhQ0QVL-MWK8RDn7MG4LlsjAeXa3Xw6ZjMib3YQ1cNuGRNm9asEZYSnkqdxtGrHJN29mo-zY4CST54Oi23yN1YM7Ul8CrSdlYGNUWGHsVG-GQrC_f-PM=w2560"),
    ("12d25c55f4144239aaeecb35157ad377",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjU2NDBlNjQwMjNiZDk3ZTA5MzBlZDVlEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLvuPJfdUDAY6tUQ1-EUGEq3ucR2VNBY49q_FuNYDi1BsV_RK6cc2xB5yWc59HtbaUqirCkbZVOdyuTiseDqWxBgVl8lF4Nm_2j9goUFIH6nV_Tf5RGJjFcXV2YunG04cSu6eU6O1wrJosgZhdp21BsUserTRMsJDyjIKpKLL5By8ZA6e6GwMP-pf0Yqznu45PaYCikvs9Lo-jAubXqzkPDr0pmkB3l54NEx1DGsvbV9nOwm_Bcp0SoCcgHU=w2560"),
    ("25d6fbb9a1304e1f80fa25b1585bdc97",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ1OTFmYjg0ZWQwNDRmNWQzYzcwMDNlMWJkEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLvaqDvKnyibTex4YWofWZLlFvCydWjca5fRlhT9VnqUeTsh87W8EVgyhL-ZKYNANGAOP0HEFq9G7wGAb3RukB9YdR_OSxprn84xNvqIddKzK-Ao0O5tqPqw6MDJtvyqXsgM7zJTBXL13XeKmLfzpUaHV5hSEncvYuAocgvTf9NWFQH-GAtY2b1F0XviK6Bl6w1QLT5uxkGxbG7WZNxWtLHxERp-mQq6nCQIsD5JaLHgBpeI0lxHS9rOAuTm=w2560"),
    ("2b5790366e1d475692cecd2088ba8157",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjU0YjY1MzMwOTY4OGFlYjA5MWYwMWRlEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLsZgRxaIMgSEDZZ5aUKfaJdpbcZrDiZwEAmCjuQMjwWOvnoo-uIHN_7bu5AD2FTVpByziS8HAdqENyySC9ouIJg8fD7Iqt5GnhKGdgJyRacwO8tDKi4ru3M1af7XJ880QM1DdB-ZAp1ctolM3q9pRz-go7X1ueriW4G66REL_j86m71ncCmlFcVYb5UL2daNvgs66bG5TIreGcEBTvhbRU267Cdpa2u1rx4_nia3RE8N-Fa0mbMMV2JcBY=w2560"),
    ("2d9d96a1f5d642af86626a224eb87c1d",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjQ3N2VmZWQwNDc5ZjE0NmQzMDlkODk2EgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLvu1I-jkgWyfmPjz5iV_o8OAo3e0PN4-afM0yN2bzbvdzLU-SvoWUOmtcbz6OXRGoUc2oUzagRr2jF0Mte9-NPI-hT3s0XrSB4oIHc-PR9v_P4zgHXGvXjyl8KXKgYPEJRL7Sa3HRbywfRVLeiiVotA1cITLoOuW8vFgX66hVb5rPTV3pq9HDPKHrx1stBHLiBq7xL59Zh9wULuoiO0_lh99QxIMRFufgdxFrA1DgJluw69fLkbW6qaVpHn=w2560"),
    ("78e569ddd9df44f39f3fcff30c4f7a9b",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2ODc5ZTM0ZjQwNDc5ZjE0NmQzMDlkODk2EgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLunLI2C7q92PhlzpjBsQiDvGuVprnUIH6MqB4U4sz4HAPPGitNrVzSocbwopwFWOV7ckzF_fEb6QBWvkVrI0lPoJZS1SIIvv7cgcF1MkZtzCj6Tb--9_yZo43KngYSwqi3HqSQkaEzKD55xHR96FFl8LyDX1CkaB18Rg_xp4y-us1EHw7uqRwXQEBBf287KOuJy5UUmXWc74nh5v1LahmIPMiruQsNUMB7uMKPwohFxIx7sK5uq74iZkakq=w2560"),
    ("80d907b74d424d6cb5eb200a8a584826",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjQ1OTNmNmEwNDc5ZjNjMzZkMjY4MjI2EgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLt3QBOzWMY9ypSyvD2rETIYf5722Ego5BCl2PJu7OpbBReLPwyKE8rwNhBpJzMutZBiVT9IFiPwfWMKwBxH-P99Qy122IW0jDG6FjtE3nawWet579HqVNeHLKbEsfleiq-Azglqq_Mr-jw4znJmHJu1HjjXzQb2iDV_KNQMp9R14FF_9L6irCZgk_OzrgSAEZ5ttwH0x6jTLDwdp1DWIZVM2b8fbZTQ6O48K_1Rp1Tev02Pz-81sjUyjy4j=w2560"),
    ("8cd7ded5f97a41f7bb38daef23b045dd",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzYwZDMyZDE2OGQwOTY4OTRhMGU5MmY1MTBhEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLujUJuu9J09M97ZdbKtAxoZxWRmn-kH318bBzST_ql-Y3pj6vjPRJ9Ens-b54tFGHTo-h2Up-r2rn5dT3gPkt0bDYIXtgPB7uY4Euc_WT82VGF6-h8VHXWiJhVhmcGSTZopztYcV8VZSwetwlAiZgneSs2uHd0mB7gKsEAdcrIqJ7CJRMQqTE3Ki17qzR1Xp0A1vcA0F1H_cLDY08LSSHv6o96D4gkcpH8HnYtvFuej6jnSOHyPMrIsGZ_E=w2560"),
    ("b97004b075504cd4814866b577ee6616",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjRlMzBjMWUwNWYxMjAxYWU0MDlmZGVjEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLsWP0URAGFv08RtcH7jkbtjowIxsOou7UPVc-pemhHjtmbWIcBbSyinLBB9IUSRoP729MRClSdnPT3a8-nFWWko9TOWLybv3tiPCYt-xGBY_ZLZQjzF9TUi3Lime6x0cGJnqb-W3f-QmqajmWdH2orB3v25d8zGM-UtHA8Oa_EbM_Zj9c40AhXZ0ztPpBUWoLjFzUCv4G0ii_gltMPma6bSZzJjc5B-JFSGVK61SwfwUDgnFM5RFmzTIqs=w2560"),
    ("c9475c7c14f3426dab24cc48dafa25ad",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjUyZGMxYzIwNWYxMjAxYWU0MDlmZGVjEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLuGH8edzPiZclNjvXXPWVFCS4uanpn9GZXFJioyASDy0WWSzEyou4-Iux1LIYjShZoqYpcaDCBiGYSzuIF7M05FryVv9cmSP1BevN-PSm8gEPlZbM5TTlGRoj_mDjOaoIJmfYSfScXs3deVOol4-YKVkQ1jOx8UiDZEyyfucTbapvqyJkbc7Xqut3Svi-N8WXqujDWFpClHrSYgE5v3vML3lrDgm1cf6f2MIIkoeTlVIqW0xOsRaCMeL9gT=w2560"),
    ("d40fefa9dd8e421aa1dd66826c92f38a",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2NjRjNzQ2YzUwMjNiZDM1ODcyMGFjZDNmEgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLtzj8lqAONTPmPug-AOKpzcbPBBldjzA2blsa7Rer6aSDbp5NANuu33WPCJ6HowsWSd0rpIDkkQt50GwkNNJzMhDFgDPy9hmQK3NSssk5MrDj_6AjYDnKU5EB74T5uyJrAMLQiqJ_218M1uPzHrfQIHG-2drFnPOQPByI0XxfGKC_YBCX3KWyz06h2hw_u12bDxWi-IF3yq1BS0eA8sQSz6hfOdNHOmdsABTJ3YSjWu7A22cXY3PK_WXnxR=w3136"),
    ("edbee62764a04183bd6be1311a01b192",
     "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NzQ2YjQ3NjUzMWYwOTY4OWQ3OTE0MTZlZmY3EgsSBxCC0e-F-REYAZIBJAoKcHJvamVjdF9pZBIWQhQxODE4Njk2MjA2NTExOTQ1NTAxNQ&filename=&opi=89354086",
     "https://lh3.googleusercontent.com/aida/AP1WRLtXH1n51PgUgaIAj49JQG-i5qJezeoB19h1iEY40dI2N5huyCbNvfDTgRZ4KcFZ3or3OlbQxXiacOXXHEhC-p6O_MrN4o8nc80PmcxT-CbJvvVlnHSc-GihkbdRWtjgwvZmTji49lVZsThzmPVPhZuTuXxU1JL7h_jUIHLK6lObFiir7zqf2OPFQ0DwDaKAzS8s0DCn-Mct0VvyH0Sq5zOaA3hcU9xo9P-OD-A09KRqUDh7ZL8j-OoaWY4=w2560")
]

os.makedirs('.stitch/designs', exist_ok=True)
for screen_id, html_url, png_url in screens:
    print(f"Downloading {screen_id}...")
    try:
        urllib.request.urlretrieve(html_url, f".stitch/designs/{screen_id}.html")
        urllib.request.urlretrieve(png_url, f".stitch/designs/{screen_id}.png")
    except Exception as e:
        print(f"Failed {screen_id}: {e}")
print("Done!")
