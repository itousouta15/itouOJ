export type CpeCatalogProblem = {
  code: string;
  title: string;
  samples: { input: string; output: string }[];
};

// Public CPE problem examples captured from this site, not hidden judge cases.
export const cpeProblemCatalog: CpeCatalogProblem[] = [
  {
    "code": "a460",
    "title": "a460. CPE：Die Game (UVa 10409)",
    "samples": [
      {
        "input": "1\nnorth\n3\nnorth\neast\nsouth\n0\n",
        "output": "5\n1\n"
      }
    ]
  },
  {
    "code": "a461",
    "title": "a461. CPE：The Hotel with Infinite Rooms (UVa 10170)",
    "samples": [
      {
        "input": "1 6\n3 10\n3 14\n",
        "output": "3\n5\n6\n"
      }
    ]
  },
  {
    "code": "a462",
    "title": "a462. CPE：Jolly Jumpers (UVa 10038)",
    "samples": [
      {
        "input": "4 1 4 2 3\n5 1 4 2 -1 6\n",
        "output": "Jolly\nNot jolly\n"
      }
    ]
  },
  {
    "code": "a463",
    "title": "a463. CPE：Score (UVa 1585)",
    "samples": [
      {
        "input": "5\nOOXXOXXOOO\nOOXXOOXXOO\nOXOXOXOXOXOXOX\nOOOOOOOOOO\nOOOOXOOOOXOOOOX\n",
        "output": "10\n9\n7\n55\n30\n"
      }
    ]
  },
  {
    "code": "a464",
    "title": "a464. CPE：Joana and the Odd Numbers (UVa 913)",
    "samples": [
      {
        "input": "3\n5\n7\n",
        "output": "15\n45\n87\n"
      }
    ]
  },
  {
    "code": "a465",
    "title": "a465. CPE：Parentheses Balance (UVa 673)",
    "samples": [
      {
        "input": "3\n([])\n(([()])))\n([()[]()])()\n",
        "output": "Yes\nNo\nYes\n"
      }
    ]
  },
  {
    "code": "a466",
    "title": "a466. CPE：Kindergarten Counting Game (UVa 494)",
    "samples": [
      {
        "input": "Meep Meep!\nI tot I taw a putty tat.\nI did! I did! I did taw a putty tat.\nShsssssssssh ... I am hunting wabbits. Heh Heh Heh Heh ...\n",
        "output": "2\n7\n10\n9\n"
      }
    ]
  },
  {
    "code": "a467",
    "title": "a467. CPE：TEX Quotes (UVa 272)",
    "samples": [
      {
        "input": "\"To be or not to be,\" quoth the Bard, \"that\nis the question\".\nThe programming contestant replied: \"I must disagree.\nTo `C' or not to `C', that is The Question!\"\n",
        "output": "``To be or not to be,'' quoth the Bard, ``that\nis the question''.\nThe programming contestant replied: ``I must disagree.\nTo `C' or not to `C', that is The Question!''\n"
      }
    ]
  },
  {
    "code": "a468",
    "title": "a468. CPE：Cola (UVa 11150)",
    "samples": [
      {
        "input": "8\n",
        "output": "12\n"
      }
    ]
  },
  {
    "code": "a469",
    "title": "a469. CPE：Lumberjack Sequencing (UVa 11942)",
    "samples": [
      {
        "input": "3\n13 25 39 40 55 62 68 77 88 95\n88 62 77 20 40 10 99 56 45 36\n91 78 61 59 54 49 43 33 26 18\n",
        "output": "Lumberjacks:\nOrdered\nUnordered\nOrdered\n"
      }
    ]
  },
  {
    "code": "a470",
    "title": "a470. CPE：Abstract Names (UVa 11713)",
    "samples": [
      {
        "input": "5\npele\npolo\npele\npola\nronaldo\nronaldino\npele\npelet\npele\nbele\n",
        "output": "Yes\nYes\nNo\nNo\nNo\n"
      }
    ]
  },
  {
    "code": "a471",
    "title": "a471. CPE：Digit Generator (UVa 1583)",
    "samples": [
      {
        "input": "3\n216\n121\n2005\n",
        "output": "198\n0\n1979\n"
      }
    ]
  },
  {
    "code": "a472",
    "title": "a472. CPE：Digit Counting (UVa 1225)",
    "samples": [
      {
        "input": "2\n3\n13\n",
        "output": "0 1 1 1 0 0 0 0 0 0\n1 6 2 2 1 1 1 1 1 1\n"
      }
    ]
  },
  {
    "code": "a473",
    "title": "a473. CPE：Train Swapping (UVa 299)",
    "samples": [
      {
        "input": "3\n3\n1 3 2\n4\n4 3 2 1\n2\n2 1\n",
        "output": "Optimal train swapping takes 1 swaps.\nOptimal train swapping takes 6 swaps.\nOptimal train swapping takes 1 swaps.\n"
      }
    ]
  },
  {
    "code": "a474",
    "title": "a474. CPE：Light, more light (UVa 10110)",
    "samples": [
      {
        "input": "3\n6241\n8191\n0\n",
        "output": "no\nyes\nno\n"
      }
    ]
  },
  {
    "code": "a475",
    "title": "a475. CPE：Square Numbers (UVa 11461)",
    "samples": [
      {
        "input": "1 4\n1 10\n0 0\n",
        "output": "2\n3\n"
      }
    ]
  },
  {
    "code": "a476",
    "title": "a476. CPE：f91 (UVa 10696)",
    "samples": [
      {
        "input": "500\n91\n0\n",
        "output": "f91(500) = 490\nf91(91) = 91\n"
      }
    ]
  },
  {
    "code": "a477",
    "title": "a477. CPE：Back to High School Physics (UVa 10071)",
    "samples": [
      {
        "input": "0 0\n5 12\n",
        "output": "0\n120\n"
      }
    ]
  },
  {
    "code": "a478",
    "title": "a478. CPE：Zeros and Ones (UVa 12063)",
    "samples": [
      {
        "input": "5\n6 3\n6 4\n6 2\n26 3\n64 2\n",
        "output": "Case 1: 1\nCase 2: 3\nCase 3: 6\nCase 4: 1662453\nCase 5: 465428353255261088\n"
      }
    ]
  },
  {
    "code": "a479",
    "title": "a479. CPE：H(n) (UVa 11526)",
    "samples": [
      {
        "input": "2\n5\n10\n",
        "output": "10\n27\n"
      }
    ]
  },
  {
    "code": "a480",
    "title": "a480. CPE：Arrange the Numbers (UVa 11481)",
    "samples": [
      {
        "input": "1\n5 3 2\n",
        "output": "Case 1: 12\n"
      }
    ]
  },
  {
    "code": "a481",
    "title": "a481. CPE：Blocks (UVa 10365)",
    "samples": [
      {
        "input": "5\n9\n10\n26\n27\n100\n",
        "output": "30\n34\n82\n54\n130\n"
      }
    ]
  },
  {
    "code": "a482",
    "title": "a482. CPE：Hardwood Species (UVa 10226)",
    "samples": [
      {
        "input": "1\n\nRed Alder\nAsh\nAspen\nBasswood\nAsh\nBeech\nYellow Birch\nAsh\nCherry\nCottonwood\nAsh\nCypress\nRed Elm\nGum\nHackberry\nWhite Oak\nHickory\nPecan\nHard Maple\nWhite Oak\nSoft Maple\nRed Oak\nRed Oak\nWhite Oak\nPoplan\nSassafras\nSycamore\nBlack Walnut\nWillow\n",
        "output": "Ash 13.7931\nAspen 3.4483\nBasswood 3.4483\nBeech 3.4483\nBlack Walnut 3.4483\nCherry 3.4483\nCottonwood 3.4483\nCypress 3.4483\nGum 3.4483\nHackberry 3.4483\nHard Maple 3.4483\nHickory 3.4483\nPecan 3.4483\nPoplan 3.4483\nRed Alder 3.4483\nRed Elm 3.4483\nRed Oak 6.8966\nSassafras 3.4483\nSoft Maple 3.4483\nSycamore 3.4483\nWhite Oak 10.3448\nWillow 3.4483\nYellow Birch 3.4483\n"
      }
    ]
  },
  {
    "code": "a483",
    "title": "a483. CPE：Where's Waldorf? (UVa 10010)",
    "samples": [
      {
        "input": "1\n\n8 11\nabcDEFGhigg\nhEbkWalDork\nFtyAwaldORm\nFtsimrLqsrc\nbyoArBeDeyv\nKlcbqwikomk\nstrEBGadhrb\nyUiqlxcnBjf\n4\nWaldorf\nBambi\nBetty\nDagbert\n",
        "output": "2 5\n2 3\n1 2\n7 8\n"
      }
    ]
  },
  {
    "code": "a484",
    "title": "a484. CPE：Building designing (UVa 11039)",
    "samples": [
      {
        "input": "2\n5\n7\n-2\n6\n9\n-3\n8\n11\n-9\n2\n5\n18\n17\n-15\n4\n",
        "output": "2\n5\n"
      }
    ]
  },
  {
    "code": "a485",
    "title": "a485. CPE：Dangerous Dive (UVa 12650)",
    "samples": [
      {
        "input": "5 3\n3 1 5\n6 6\n6 1 3 2 5 4\n",
        "output": "2 4\n*\n"
      }
    ]
  },
  {
    "code": "a486",
    "title": "a486. CPE：Feynman (UVa 12149)",
    "samples": [
      {
        "input": "2\n1\n8\n0\n",
        "output": "5\n1\n204\n"
      }
    ]
  },
  {
    "code": "a487",
    "title": "a487. CPE：Google is Feeling Lucky (UVa 12015)",
    "samples": [
      {
        "input": "2\nwww.youtube.com 1\nwww.google.com 2\nwww.google.com.hk 3\nwww.alibaba.com 10\nwww.taobao.com 5\nwww.bad.com 10\nwww.good.com 7\nwww.fudan.edu.cn 8\nwww.university.edu.cn 9\nacm.university.edu.cn 10\nwww.youtube.com 1\nwww.google.com 2\nwww.google.com.hk 3\nwww.alibaba.com 11\nwww.taobao.com 5\nwww.bad.com 10\nwww.good.com 7\nwww.fudan.edu.cn 8\nacm.university.edu.cn 9\nacm.university.edu.cn 10\n",
        "output": "Case #1:\nwww.alibaba.com\nwww.bad.com\nacm.university.edu.cn\nCase #2:\nwww.alibaba.com\n"
      }
    ]
  },
  {
    "code": "a488",
    "title": "a488. CPE：Jumping Mario (UVa 11764)",
    "samples": [
      {
        "input": "3\n8\n1 4 2 2 3 5 3 4\n1\n9\n5\n1 2 3 4 5\n",
        "output": "Case 1: 4 2\nCase 2: 0 0\nCase 3: 4 0\n"
      }
    ]
  },
  {
    "code": "a489",
    "title": "a489. CPE：Alarm Clock (UVa 11677)",
    "samples": [
      {
        "input": "1 5 3 5\n23 59 0 34\n21 33 21 10\n0 0 0 0\n",
        "output": "120\n35\n1417\n"
      }
    ]
  },
  {
    "code": "a490",
    "title": "a490. CPE：Decoding (UVa 11541)",
    "samples": [
      {
        "input": "3\nA2B4D1A2\nA12\nA1B1C1D1\n",
        "output": "Case 1: AABBBBDAA\nCase 2: AAAAAAAAAAAA\nCase 3: ABCD\n"
      }
    ]
  },
  {
    "code": "a491",
    "title": "a491. CPE：Division of Nlogonia (UVa 11498)",
    "samples": [
      {
        "input": "3\n2 1\n10 10\n-10 1\n0 33\n4\n-1000 -1000\n-1000 -1000\n0 0\n-2000 -10000\n-999 -1001\n0\n",
        "output": "NE\ndivisa\nNO\ndivisa\nNE\nSO\nSE\n"
      }
    ]
  },
  {
    "code": "a492",
    "title": "a492. CPE：GCD (UVa 11417)",
    "samples": [
      {
        "input": "10\n100\n500\n0\n",
        "output": "67\n13015\n442011\n"
      }
    ]
  },
  {
    "code": "a493",
    "title": "a493. CPE：Summing Digits (UVa 11332)",
    "samples": [
      {
        "input": "2\n11\n47\n1234567892\n0\n",
        "output": "2\n2\n2\n2\n"
      }
    ]
  },
  {
    "code": "a494",
    "title": "a494. CPE：2 the 9s (UVa 10922)",
    "samples": [
      {
        "input": "999999999999999999999\n9\n9999999999999999999999999999998\n0\n",
        "output": "999999999999999999999 is a multiple of 9 and has 9-degree 3.\n9 is a multiple of 9 and has 9-degree 1.\n9999999999999999999999999999998 is not a multiple of 9.\n"
      }
    ]
  },
  {
    "code": "a495",
    "title": "a495. CPE：Combination Lock (UVa 10550)",
    "samples": [
      {
        "input": "0 30 0 30\n5 35 5 35\n0 20 0 20\n7 27 7 27\n0 10 0 10\n9 19 9 19\n0 0 0 0\n",
        "output": "1350\n1350\n1620\n1620\n1890\n1890\n"
      }
    ]
  },
  {
    "code": "a496",
    "title": "a496. CPE：Guessing Game (UVa 10530)",
    "samples": [
      {
        "input": "10\ntoo high\n3\ntoo low\n4\ntoo high\n2\nright on\n5\ntoo low\n7\ntoo high\n6\nright on\n0\n",
        "output": "Stan is dishonest\nStan may be honest\n"
      }
    ]
  },
  {
    "code": "a497",
    "title": "a497. CPE：Happy Number (UVa 10591)",
    "samples": [
      {
        "input": "3\n7\n4\n13\n",
        "output": "Case #1: 7 is a Happy number.\nCase #2: 4 is an Unhappy number.\nCase #3: 13 is a Happy number.\n"
      }
    ]
  },
  {
    "code": "a498",
    "title": "a498. CPE：Quadtrees (UVa 297)",
    "samples": [
      {
        "input": "3\nppeeefpffeefe\npefepeefe\npeeef\npeefe\npeeef\npeepefefe\n",
        "output": "There are 640 black pixels.\nThere are 512 black pixels.\nThere are 384 black pixels.\n"
      }
    ]
  },
  {
    "code": "a499",
    "title": "a499. CPE：False coin (UVa 665)",
    "samples": [
      {
        "input": "2\n\n5 3\n2 1 2 3 4\n<\n1 1 4\n=\n1 2 5\n=\n\n6 4\n3 1 2 3 4 5 6\n<\n1 1 2\n=\n2 1 3 4 5\n<\n2 4 5 2 6\n>\n",
        "output": "3\n\n0\n"
      }
    ]
  },
  {
    "code": "a500",
    "title": "a500. CPE：Containers (UVa 1062)",
    "samples": [
      {
        "input": "A\nCBACBACBACBACBA\nCCCCBBBBAAAA\nACMICPC\nend\n",
        "output": "Case 1: 1\nCase 2: 3\nCase 3: 1\nCase 4: 4\n"
      }
    ]
  },
  {
    "code": "a501",
    "title": "a501. CPE：Minesweeper (UVa 10189)",
    "samples": [
      {
        "input": "4 4\n*...\n....\n.*..\n....\n3 5\n**...\n.....\n.*...\n0 0\n",
        "output": "Field #1:\n*100\n2210\n1*10\n1110\n\nField #2:\n**100\n33200\n1*100\n"
      }
    ]
  },
  {
    "code": "a502",
    "title": "a502. CPE：Brainfuck (UVa 11956)",
    "samples": [
      {
        "input": "1\n..++<><<+++>>++++++++++++++++++++++++++>>>+++<+...++<><<+++>>++++++++++++++++++++++++++>>>+++<+...++<><<+++>>++++++++++++++++++++++++++>>>+++<+.\n",
        "output": "Case 1: 1F 00 20 03 1D 03 01 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 03 00\n"
      }
    ]
  },
  {
    "code": "a503",
    "title": "a503. CPE：Guard the Land (UVa 11639)",
    "samples": [
      {
        "input": "2\n10 10 20 20\n15 15 25 25\n10 10 20 20\n20 20 30 30\n",
        "output": "Night 1: 25 150 9825\nNight 2: 0 200 9800\n"
      }
    ]
  },
  {
    "code": "a504",
    "title": "a504. CPE：Count these Permutations (UVa 13204)",
    "samples": [
      {
        "input": "1\n2\n3\n",
        "output": "1\n1\n3\n"
      }
    ]
  },
  {
    "code": "a505",
    "title": "a505. CPE：Subset sum (UVa 12911)",
    "samples": [
      {
        "input": "6 0\n-1 2 -3 4 -5 6\n5 0\n-7 -3 -2 5 8\n",
        "output": "4\n1\n"
      }
    ]
  },
  {
    "code": "a506",
    "title": "a506. CPE：LCM Pair Sum (UVa 12546)",
    "samples": [
      {
        "input": "3\n2\n2 1\n3 1\n2\n2 2\n3 1\n1\n5 1\n",
        "output": "Case 1: 41\nCase 2: 117\nCase 3: 16\n"
      }
    ]
  },
  {
    "code": "a507",
    "title": "a507. CPE：Forwarding Emails (UVa 12442)",
    "samples": [
      {
        "input": "3\n3\n1 2\n2 3\n3 1\n4\n1 2\n2 1\n4 3\n3 2\n5\n1 2\n2 1\n5 3\n3 4\n4 5\n",
        "output": "Case 1: 1\nCase 2: 4\nCase 3: 3\n"
      }
    ]
  },
  {
    "code": "a508",
    "title": "a508. CPE：Grid of Lamps (UVa 12382)",
    "samples": [
      {
        "input": "3\n2 2\n2 0\n0 2\n1 4\n2\n1 0 1 1\n2 4\n3 1\n0 2 1 2\n",
        "output": "3\n3\n5\n"
      }
    ]
  },
  {
    "code": "a509",
    "title": "a509. CPE：Moving to Nuremberg (UVa 12223)",
    "samples": [
      {
        "input": "2\n2\n1 2 17\n2\n1 5\n2 10\n5\n1 3 10\n2 3 20\n3 4 30\n4 5 30\n3\n1 10\n2 10\n5 20\n",
        "output": "170\n2\n3000\n3 4 5\n"
      }
    ]
  },
  {
    "code": "a510",
    "title": "a510. CPE：Checkers (UVa 11957)",
    "samples": [
      {
        "input": "2\n4\n....\n....\n....\n..W.\n8\n.B.B.B..\n........\n........\n..B.....\n........\n..B.....\n.W......\n........\n",
        "output": "Case 1: 5\nCase 2: 1\n"
      }
    ]
  },
  {
    "code": "a511",
    "title": "a511. CPE：Skyscraper (UVa 11908)",
    "samples": [
      {
        "input": "1\n3\n1 5 1\n2 10 3\n7 12 1\n",
        "output": "Case 1: 3\n"
      }
    ]
  },
  {
    "code": "a512",
    "title": "a512. CPE：Alternate Task (UVa 11728)",
    "samples": [
      {
        "input": "1\n102\n1000\n0\n",
        "output": "Case 1: 1\nCase 2: 101\nCase 3: -1\n"
      }
    ]
  },
  {
    "code": "a513",
    "title": "a513. CPE：Food portion size (UVa 11633)",
    "samples": [
      {
        "input": "5\n1 1\n3 7 1 9 12\n3\n10 1\n11 13 17\n2\n2 3\n6 3\n0\n",
        "output": "35 / 2\n154 / 3\n9\n"
      }
    ]
  },
  {
    "code": "a514",
    "title": "a514. CPE：Beautiful Numbers (UVa 11472)",
    "samples": [
      {
        "input": "3\n2 4\n3 7\n10 10\n",
        "output": "3\n31\n1\n"
      }
    ]
  },
  {
    "code": "a515",
    "title": "a515. CPE：Having Fun with Matrices (UVa 11360)",
    "samples": [
      {
        "input": "2\n4\n1234\n5678\n1234\n5678\n1\ntranspose\n3\n000\n111\n000\n2\nrow 1 2\ninc\n",
        "output": "Case #1\n1515\n2626\n3737\n4848\n\nCase #2\n222\n111\n111\n\n"
      }
    ]
  },
  {
    "code": "a516",
    "title": "a516. CPE：Coin Collector (UVa 11264)",
    "samples": [
      {
        "input": "2\n6\n1 2 4 8 16 32\n6\n1 3 6 8 15 20\n",
        "output": "6\n4\n"
      }
    ]
  },
  {
    "code": "a517",
    "title": "a517. CPE：Decoding the message (UVa 11220)",
    "samples": [
      {
        "input": "2\n\nHey good lawyer\nas I previously previewed\nyam does a soup\n\nFirst I give money to Teresa\nafter I inform dad of\nyour horrible soup\n",
        "output": "Case #1:\nHow\nare\nyou\n\nCase #2:\nFine\nand\nyou\n"
      }
    ]
  },
  {
    "code": "a518",
    "title": "a518. CPE：Dynamic Frog (UVa 11157)",
    "samples": [
      {
        "input": "3\n1 10\nB-5\n1 10\nS-5\n2 10\nB-3 S-6\n",
        "output": "Case 1: 5\nCase 2: 10\nCase 3: 7\n"
      }
    ]
  },
  {
    "code": "a519",
    "title": "a519. CPE：Back to the 8-Queens (UVa 11085)",
    "samples": [
      {
        "input": "1 2 3 4 5 6 7 8\n1 1 1 1 1 1 1 1\n",
        "output": "Case 1: 7\nCase 2: 7\n"
      }
    ]
  },
  {
    "code": "a520",
    "title": "a520. CPE：Wine trading in Gergovia (UVa 11054)",
    "samples": [
      {
        "input": "5\n5 -4 1 -3 1\n6\n-1000 -1000 -1000 1000 1000 1000\n0\n",
        "output": "9\n9000\n"
      }
    ]
  },
  {
    "code": "a521",
    "title": "a521. CPE：Boxes (UVa 11003)",
    "samples": [
      {
        "input": "5\n19 15\n7 13\n5 7\n6 8\n1 2\n0\n",
        "output": "4\n"
      }
    ]
  },
  {
    "code": "a522",
    "title": "a522. CPE：Pool Filling (UVa 13242)",
    "samples": [
      {
        "input": "2\n615 11\n15\n24 18\n25 5\n74 4\n80 5\n75 3\n96 2\n53 6\n25 24\n74 20\n97 20\n76 3\n14 16\n8 3\n21 14\n82 18\n100 20\n3\n10 20\n66 40\n5 100\n",
        "output": "5 12\nNot possible\n"
      }
    ]
  },
  {
    "code": "a523",
    "title": "a523. CPE：Add All (UVa 10954)",
    "samples": [
      {
        "input": "3\n1 2 3\n4\n1 2 3 4\n0\n",
        "output": "9\n19\n"
      }
    ]
  },
  {
    "code": "a524",
    "title": "a524. CPE：City Park (UVa 12882)",
    "samples": [
      {
        "input": "8\n14 1 2 2\n16 9 1 5\n11 3 5 2\n3 4 2 5\n5 9 3 2\n21 3 2 8\n13 2 1 1\n13 8 3 5\n",
        "output": "20\n"
      }
    ]
  },
  {
    "code": "a525",
    "title": "a525. CPE：Rock-Paper-Scissors Tournament (UVa 10903)",
    "samples": [
      {
        "input": "2 4\n1 rock 2 paper\n1 scissors 2 paper\n1 rock 2 rock\n2 rock 1 scissors\n2 1\n1 rock 2 paper\n0\n",
        "output": "0.333\n0.667\n\n0.000\n1.000\n"
      }
    ]
  },
  {
    "code": "a526",
    "title": "a526. CPE：Meeting Room Arrangement (UVa 12694)",
    "samples": [
      {
        "input": "3\n0 6\n5 7\n8 9\n5 9\n1 2\n3 4\n0 5\n0 0\n6 10\n5 6\n0 3\n0 5\n3 5\n4 5\n0 0\n1 5\n3 9\n0 0\n",
        "output": "4\n4\n1\n"
      }
    ]
  },
  {
    "code": "a527",
    "title": "a527. CPE：Letters (UVa 12797)",
    "samples": [
      {
        "input": "6\nDdaAaA\nCBAcca\neEaeeE\nbBbabB\nDbDdDc\nfFaAaC\n7\naAaaaaa\naAaaaAa\naAaaaAA\naaAaAaa\nAaAaaAa\naaAAaAa\naaaaaAa\n",
        "output": "13\n-1\n"
      }
    ]
  },
  {
    "code": "a528",
    "title": "a528. CPE：Enemy at the Gates (UVa 12428)",
    "samples": [
      {
        "input": "2\n4 4\n4 3\n",
        "output": "1\n3\n"
      }
    ]
  },
  {
    "code": "a529",
    "title": "a529. CPE：Informants (UVa 11659)",
    "samples": [
      {
        "input": "4 5\n1 2\n1 -4\n2 -3\n3 1\n3 4\n1 1\n1 -1\n3 3\n1 2\n2 3\n3 -1\n0 0\n",
        "output": "2\n0\n2\n"
      }
    ]
  },
  {
    "code": "a530",
    "title": "a530. CPE：Edgetown’s Traffic Jams (UVa 12319)",
    "samples": [
      {
        "input": "5\n1 2 3\n2 1 5\n3 4 5 1\n4 3 5\n5 2 3 4\n1 2\n2 5\n3 1 4\n4 5\n5 3\n1 2\n5\n1 2 3\n2 1 5\n3 4 5 1\n4 3 5\n5 2 3 4\n1 2\n2 5\n3 1 4\n4 5\n5 3\n2 0\n3\n1 2\n2 1 3\n3 1 2\n1 2\n2 3\n3 1\n0 2\n0\n",
        "output": "Yes\nNo\nYes\n"
      }
    ]
  },
  {
    "code": "a531",
    "title": "a531. CPE：String Theory (UVa 1746)",
    "samples": [
      {
        "input": "5\n2 1 1 1 3\n1\n22\n1\n1\n",
        "output": "2\n4\nno quotation\n"
      }
    ]
  },
  {
    "code": "a532",
    "title": "a532. CPE：Alcoholic Pilots (UVa 12970)",
    "samples": [
      {
        "input": "2 4 1 3\n1 3 2 4\n4 7 4 9\n0 0 0 0\n",
        "output": "Case #1: You owe me a beer!\nAvg. arrival time: 5/2\nCase #2: No beer for the captain.\nAvg. arrival time: 5/2\nCase #3: You owe me a beer!\nAvg. arrival time: 2\n"
      }
    ]
  },
  {
    "code": "a533",
    "title": "a533. CPE：How Many Ones Needed? (UVa 12208)",
    "samples": [
      {
        "input": "5 10\n20 30\n0 0\n",
        "output": "Case 1: 12\nCase 2: 35\n"
      }
    ]
  },
  {
    "code": "a534",
    "title": "a534. CPE：Lexicographic Order (UVa 12335)",
    "samples": [
      {
        "input": "3\nbdac 11\nabcd 5\nhjbrl 120\n",
        "output": "Case 1: abcd\nCase 2: acdb\nCase 3: lrbjh\n"
      }
    ]
  },
  {
    "code": "a535",
    "title": "a535. CPE：BFS (Binary Fibonacci String) (UVa 12041)",
    "samples": [
      {
        "input": "3\n3 1 2\n1 0 0\n9 5 12\n",
        "output": "01\n1\n10101101\n"
      }
    ]
  },
  {
    "code": "a536",
    "title": "a536. CPE：Not That Kind of Graph (UVa 10800)",
    "samples": [
      {
        "input": "1\nRCRFCRFFCCRRC\n",
        "output": "Case #1:\n|             _\n|  _/\\_/\\    /\n| /      \\__/\n+---------------\n\n"
      }
    ]
  },
  {
    "code": "a537",
    "title": "a537. CPE：Not the Best (UVa 10740)",
    "samples": [
      {
        "input": "3 3\n1 3 4\n1 3 3\n1 2 4\n2 3 5\n5 6\n5 2 5\n1 2 2\n2 5 4\n3 2 3\n4 3 1\n5 1 3\n5 4 2\n2 2\n1 2 3\n1 2 5\n2 2 2\n0 0\n",
        "output": "-1\n15\n9\n"
      }
    ]
  },
  {
    "code": "a538",
    "title": "a538. CPE：Ultra-QuickSort (UVa 10810)",
    "samples": [
      {
        "input": "5\n9\n1\n0\n5\n4\n3\n1\n2\n3\n0\n",
        "output": "6\n0\n"
      }
    ]
  },
  {
    "code": "a539",
    "title": "a539. CPE：Cheapest way (UVa 10436)",
    "samples": [
      {
        "input": "2\n\n4\nmirpur12 5\nfarmgate 8\ngulistan 10\nnewmarket 5\n4\nmirpur12 farmgate 12\nmirpur12 newmarket 20\nfarmgate gulistan 10\nnewmarket gulistan 8\n2\nmirpur12 gulistan 30\nmirpur12 newmarket 30\n\n3\nuttara 2\nfarmgate 8\ngulistan 10\n2\nuttara farmgate 35\nfarmgate gulistan 10\n1\nuttara gulistan 30\n",
        "output": "Map #1\nQuery #1\nmirpur12 farmgate gulistan\nEach passenger has to pay : 2.46 taka\nQuery #2\nmirpur12 newmarket\nEach passenger has to pay : 1.83 taka\n\nMap #2\nQuery #1\nuttara farmgate gulistan\nEach passenger has to pay : 4.03 taka\n"
      }
    ]
  },
  {
    "code": "a540",
    "title": "a540. CPE：Geonosis (UVa 13211)",
    "samples": [
      {
        "input": "3\n3\n0 35 58\n12 0 5\n1 2 0\n0 1 2\n3\n0 9982 1413\n8327 0 5612\n3577 7893 0\n1 0 2\n4\n0 50 10 30\n4 0 23 58\n2 1 0 5\n67 24 25 0\n0 3 1 2\n",
        "output": "96\n41118\n287\n"
      }
    ]
  },
  {
    "code": "a541",
    "title": "a541. CPE：Graphical Editor (UVa 10267)",
    "samples": [
      {
        "input": "I 5 6\nL 2 3 A\nS one.bmp\nG 2 3 J\nF 3 3 J\nV 2 3 4 W\nH 3 4 2 Z\nS two.bmp\nX\n",
        "output": "one.bmp\nOOOOO\nOOOOO\nOAOOO\nOOOOO\nOOOOO\nOOOOO\ntwo.bmp\nJJJJJ\nJJZZJ\nJWJJJ\nJWJJJ\nJJJJJ\nJJJJJ\n"
      }
    ]
  },
  {
    "code": "a542",
    "title": "a542. CPE：Pixel Art (UVa 13171)",
    "samples": [
      {
        "input": "3\n1 1 1 MCY\n3 2 1 MYWWCR\n1 1 1 RV\n",
        "output": "YES 0 0 0\nYES 1 0 0\nNO\n"
      }
    ]
  },
  {
    "code": "a543",
    "title": "a543. CPE：Copying Books (UVa 714)",
    "samples": [
      {
        "input": "2\n9 3\n100 200 300 400 500 600 700 800 900\n5 4\n100 100 100 100 100\n",
        "output": "100 200 300 400 500 / 600 700 / 800 900\n100 / 100 / 100 / 100 100\n"
      }
    ]
  },
  {
    "code": "a544",
    "title": "a544. CPE：Lucky Thief (UVa 12918)",
    "samples": [
      {
        "input": "3\n4 6\n1 2\n500 900\n",
        "output": "14\n1\n324750\n"
      }
    ]
  },
  {
    "code": "a545",
    "title": "a545. CPE：Interpreting Control Sequences (UVa 337)",
    "samples": [
      {
        "input": "7\nThis is bad^h^c\n^05^^\n^14/ \\^d^b   /   \\\n^u^d^d^l^l^l^l^l^l^l^l^l\n^r^r< ACM >^l^l^d/^b   \\\n^b^d    \\ /\n^d^l^lv\n7\n^i9^l8^l7^l6^l5^l4^l3^l2^l1^l0\n^o^d^lThis is #1^d^bThis is #2\n^d^bThis is #3^d^bThis is #4\n^d^bThis is #5^d^bThis is #6\n^d^bThis is #7^d^bThis is #8\n^i^d^bThis is #9^d^bThis is #10\n^54^e Hello^d^l^l^l^lWorld\n0\n",
        "output": "Case 1\n+----------+\n|     ^    |\n|    / \\   |\n|   /   \\  |\n|  < ACM > |\n|   \\   /  |\n|    \\ /   |\n|     v    |\n|          |\n|          |\n|          |\n+----------+\nCase 2\n+----------+\n|0123456789|\n|This is #1|\n|This is #2|\n|This is #3|\n|This is #4|\n|This Hello|\n|This World|\n|This is #7|\n|This is #8|\n|This is #0|\n+----------+\n"
      }
    ]
  },
  {
    "code": "a546",
    "title": "a546. CPE：Almost Union-Find (UVa 11987)",
    "samples": [
      {
        "input": "5 7\n1 1 2\n2 3 4\n1 3 5\n3 4\n2 4 1\n3 4\n3 3\n",
        "output": "3 12\n3 7\n2 8\n"
      }
    ]
  },
  {
    "code": "a547",
    "title": "a547. CPE：Zeroes (UVa 12869)",
    "samples": [
      {
        "input": "1 10\n1 3\n0 0\n",
        "output": "3\n1\n"
      }
    ]
  },
  {
    "code": "a548",
    "title": "a548. CPE：License Plates (UVa 13257)",
    "samples": [
      {
        "input": "5\nPROGRAMMING\nCOLOMBIA\nNUEVE\nAAAAAAA\nPQ\n",
        "output": "110\n46\n9\n1\n0\n"
      }
    ]
  },
  {
    "code": "a549",
    "title": "a549. CPE：Patches (UVa 12654)",
    "samples": [
      {
        "input": "5 20 2 3\n2 5 8 11 15\n4 20 12 9\n1 2 3 13\n",
        "output": "8\n12\n"
      }
    ]
  },
  {
    "code": "a550",
    "title": "a550. CPE：Cheerleaders (UVa 11806)",
    "samples": [
      {
        "input": "2\n2 2 1\n2 3 2\n",
        "output": "Case 1: 0\nCase 2: 2\n"
      }
    ]
  },
  {
    "code": "a551",
    "title": "a551. CPE：Rockabye Tobby (UVa 13190)",
    "samples": [
      {
        "input": "1\n2 5\nAcetaminophen 20\nLoratadine 30\n",
        "output": "20 Acetaminophen\n30 Loratadine\n40 Acetaminophen\n60 Acetaminophen\n60 Loratadine\n"
      }
    ]
  },
  {
    "code": "a552",
    "title": "a552. CPE：Foreign Exchange (UVa 10763)",
    "samples": [
      {
        "input": "10\n1 2\n2 1\n3 4\n4 3\n100 200\n200 100\n57 2\n2 57\n1 2\n2 1\n10\n1 2\n3 4\n5 6\n7 8\n9 10\n11 12\n13 14\n15 16\n17 18\n19 20\n0\n",
        "output": "YES\nNO\n"
      }
    ]
  },
  {
    "code": "a553",
    "title": "a553. CPE：How old are you? (UVa 11219)",
    "samples": [
      {
        "input": "4\n01/01/2007\n10/02/2007\n09/06/2007\n28/02/1871\n12/11/2007\n01/01/1984\n28/02/2005\n29/02/2004\n",
        "output": "Case #1: Invalid birth date\nCase #2: Check birth date\nCase #3: 23\nCase #4: 0\n"
      }
    ]
  },
  {
    "code": "a554",
    "title": "a554. CPE：Partitioning by Palindromes (UVa 11584)",
    "samples": [
      {
        "input": "3\nracecar\nfastcar\naaadbccb\n",
        "output": "1\n7\n3\n"
      }
    ]
  },
  {
    "code": "a555",
    "title": "a555. CPE：Slogan Learning of Princess (UVa 12592)",
    "samples": [
      {
        "input": "3\nko te kader molla\ntui rajakar tui rajakar\ntumi ke ami ke\ngaro chakma bangali\njalo re jalo\nagun jalo\n2\njalo re jalo\nko te kader molla\n",
        "output": "agun jalo\ntui rajakar tui rajakar\n"
      }
    ]
  },
  {
    "code": "a556",
    "title": "a556. CPE：Camel trading (UVa 10700)",
    "samples": [
      {
        "input": "3\n1+2*3*4+5\n4*18+14+7*10\n3+11+4*1*13*12*8+3*3+8\n",
        "output": "The maximum and minimum are 81 and 30.\nThe maximum and minimum are 1560 and 156.\nThe maximum and minimum are 339768 and 5023.\n"
      }
    ]
  },
  {
    "code": "a557",
    "title": "a557. CPE：Necklace (UVa 11001)",
    "samples": [
      {
        "input": "10 1\n10 2\n0 0\n",
        "output": "5\n0\n"
      }
    ]
  },
  {
    "code": "a558",
    "title": "a558. CPE：Bars (UVa 12455)",
    "samples": [
      {
        "input": "4\n25\n4\n10 12 5 7\n925\n10\n45 15 120 500 235 58 6 12 175 70\n120\n5\n25 25 25 25 25\n0\n2\n13 567\n",
        "output": "NO\nYES\nNO\nYES\n"
      }
    ]
  },
  {
    "code": "a559",
    "title": "a559. CPE：Smallest Sub-Array (UVa 11536)",
    "samples": [
      {
        "input": "2\n20 12 4\n20 12 8\n",
        "output": "Case 1: 13\nCase 2: sequence nai\n"
      }
    ]
  },
  {
    "code": "a560",
    "title": "a560. CPE：Marbles on a tree (UVa 10672)",
    "samples": [
      {
        "input": "9\n1 2 3 2 3 4\n2 1 0\n3 0 2 5 6\n4 1 3 7 8 9\n5 3 0\n6 0 0\n7 0 0\n8 2 0\n9 0 0\n9\n1 0 3 2 3 4\n2 0 0\n3 0 2 5 6\n4 9 3 7 8 9\n5 0 0\n6 0 0\n\n\n\n7 0 0\n8 0 0\n9 0 0\n9\n1 0 3 2 3 4\n2 9 0\n3 0 2 5 6\n4 0 3 7 8 9\n5 0 0\n6 0 0\n7 0 0\n8 0 0\n9 0 0\n0\n",
        "output": "7\n14\n20\n"
      }
    ]
  },
  {
    "code": "a561",
    "title": "a561. CPE：Fill (UVa 10603)",
    "samples": [
      {
        "input": "2\n2 3 4 2\n96 97 199 62\n",
        "output": "2 2\n9859 62\n"
      }
    ]
  },
  {
    "code": "a562",
    "title": "a562. CPE：Interesting Sequences (UVa 12385)",
    "samples": [
      {
        "input": "3\n6\n1 2 1 3 1 2\n4\n2 4 2 4\n9\n10 2 2 10 3 4 5 4 3\n",
        "output": "2\n1\n2\n"
      }
    ]
  },
  {
    "code": "a563",
    "title": "a563. CPE：Watering Grass (UVa 10382)",
    "samples": [
      {
        "input": "8 20 2\n5 3\n4 1\n1 2\n7 2\n10 2\n13 3\n16 2\n19 4\n3 10 1\n3 5\n9 3\n6 1\n3 10 1\n5 3\n1 1\n9 1\n",
        "output": "6\n2\n-1\n"
      }
    ]
  },
  {
    "code": "a564",
    "title": "a564. CPE：Can You Solve It? (UVa 10642)",
    "samples": [
      {
        "input": "3\n0 0 0 1\n0 0 1 0\n0 0 0 2\n",
        "output": "Case 1: 1\nCase 2: 2\nCase 3: 3\n"
      }
    ]
  },
  {
    "code": "a565",
    "title": "a565. CPE：Language Detection (UVa 12250)",
    "samples": [
      {
        "input": "HELLO\nHOLA\nHALLO\nBONJOUR\nCIAO\nZDRAVSTVUJTE\n#\n",
        "output": "Case 1: ENGLISH\nCase 2: SPANISH\nCase 3: GERMAN\nCase 4: FRENCH\nCase 5: ITALIAN\nCase 6: RUSSIAN\n"
      }
    ]
  },
  {
    "code": "a566",
    "title": "a566. CPE：Roads in the North (UVa 10308)",
    "samples": [
      {
        "input": "5 1 6\n1 4 5\n6 3 9\n2 6 8\n6 1 7\n",
        "output": "22\n"
      }
    ]
  },
  {
    "code": "a567",
    "title": "a567. CPE：Again Palindromes (UVa 10617)",
    "samples": [
      {
        "input": "3\nBAOBAB\nAAAA\nABA\n",
        "output": "22\n15\n5\n"
      }
    ]
  },
  {
    "code": "a568",
    "title": "a568. CPE：Integer Game (UVa 11489)",
    "samples": [
      {
        "input": "3\n4\n33\n771\n",
        "output": "Case 1: S\nCase 2: T\nCase 3: T\n"
      }
    ]
  },
  {
    "code": "a569",
    "title": "a569. CPE：Jingle Composing (UVa 12195)",
    "samples": [
      {
        "input": "/HH/QQQQ/XXXTXTEQH/W/HW/\n/W/W/SQHES/\n/WE/TEX/THES/\n*\n",
        "output": "4\n3\n0\n"
      }
    ]
  },
  {
    "code": "a570",
    "title": "a570. CPE：Automated Judge Script (UVa 10188)",
    "samples": [
      {
        "input": "2\nThe answer is: 10\nThe answer is: 5\n2\nThe answer is: 10\nThe answer is: 5\n2\nThe answer is: 10\nThe answer is: 5\n2\nThe answer is: 10\nThe answer is: 15\n2\nThe answer is: 10\nThe answer is:  5\n2\nThe answer is: 10\nThe answer is: 5\n3\nInput Set #1: YES\nInput Set #2: NO\nInput Set #3: NO\n3\nInput Set #0: YES\nInput Set #1: NO\nInput Set #2: NO\n1\n1 0 1 0\n1\n1010\n1\nThe judges are mean!\n1\nThe judges are good!\n0\n",
        "output": "Run #1: Accepted\nRun #2: Wrong Answer\nRun #3: Presentation Error\nRun #4: Wrong Answer\nRun #5: Presentation Error\nRun #6: Presentation Error\n"
      }
    ]
  },
  {
    "code": "a571",
    "title": "a571. CPE：Trainsorting (UVa 11456)",
    "samples": [
      {
        "input": "1\n3\n1\n2\n3\n",
        "output": "3\n"
      }
    ]
  },
  {
    "code": "a572",
    "title": "a572. CPE：Martian Mining (UVa 1366)",
    "samples": [
      {
        "input": "4 4\n0 0 10 9\n1 3 10 0\n4 2 1 3\n1 1 20 0\n10 0 0 0\n1 1 1 30\n0 0 5 5\n5 10 10 10\n0 0\n",
        "output": "98\n"
      }
    ]
  },
  {
    "code": "a573",
    "title": "a573. CPE：Rock, Scissors, Paper (UVa 10443)",
    "samples": [
      {
        "input": "2\n3 3 1\nRRR\nRSR\nRRR\n3 4 2\nRSPR\nSPRS\nPRSP\n",
        "output": "RRR\nRRR\nRRR\n\nRRRS\nRRSP\nRSPR\n"
      }
    ]
  },
  {
    "code": "a574",
    "title": "a574. CPE：Doom’s Day Algorithm (UVa 12019)",
    "samples": [
      {
        "input": "8\n1 6\n2 28\n4 5\n5 26\n8 1\n11 1\n12 25\n12 31\n",
        "output": "Thursday\nMonday\nTuesday\nThursday\nMonday\nTuesday\nSunday\nSaturday\n"
      }
    ]
  },
  {
    "code": "a575",
    "title": "a575. CPE：Flooded! (UVa 815)",
    "samples": [
      {
        "input": "3 3\n25 37 45\n51 12 34\n94 83 27\n10000\n0 0\n",
        "output": "Region 1\nWater level is 46.67 meters.\n66.67 percent of the region is under water.\n\n"
      }
    ]
  },
  {
    "code": "a576",
    "title": "a576. CPE：The Bus Driver Problem (UVa 11389)",
    "samples": [
      {
        "input": "2 20 5\n10 15\n10 15\n2 20 5\n10 10\n10 10\n0 0 0\n",
        "output": "50\n0\n"
      }
    ]
  },
  {
    "code": "a577",
    "title": "a577. CPE：Connect the Campus (UVa 10397)",
    "samples": [
      {
        "input": "4\n103 104\n104 100\n104 103\n100 100\n1\n4 2\n4\n103 104\n104 100\n104 103\n100 100\n1\n4 2\n",
        "output": "4.41\n4.41\n"
      }
    ]
  },
  {
    "code": "a578",
    "title": "a578. CPE：Divisor Game (UVa 11960)",
    "samples": [
      {
        "input": "3\n1\n10\n37\n",
        "output": "1\n10\n36\n"
      }
    ]
  },
  {
    "code": "a579",
    "title": "a579. CPE：The Huge One (UVa 11344)",
    "samples": [
      {
        "input": "4\n0\n12 1 2 3 4 5 6 7 8 9 10 11 12\n379749833583241\n1 11\n3909821048582988049\n1 7\n10\n3 1 2 9\n",
        "output": "0 - Wonderful.\n379749833583241 - Wonderful.\n3909821048582988049 - Wonderful.\n10 - Simple.\n"
      }
    ]
  },
  {
    "code": "a580",
    "title": "a580. CPE：Superman (UVa 10355)",
    "samples": [
      {
        "input": "Dhaka\n10 10 10 30 10 10\n2\n15 10 10 5\n25 10 10 5\nRio\n10 10 10 30 10 10\n1\n20 10 5 10\n",
        "output": "Dhaka\n100.00\nRio\n86.60\n"
      }
    ]
  },
  {
    "code": "a581",
    "title": "a581. CPE：Do Your Own Homework! (UVa 11917)",
    "samples": [
      {
        "input": "3\n3\ncompiler 4\ncplusplus 1\njava 8\n5\ncompiler\n2\nalgorithm 3\nmath 9\n4\nmath\n2\njava 8\nai 3\n6\ncalculus\n",
        "output": "Case 1: Yesss\nCase 2: Late\nCase 3: Do your own homework!\n"
      }
    ]
  },
  {
    "code": "a582",
    "title": "a582. CPE：Turn the Lights Off (UVa 10309)",
    "samples": [
      {
        "input": "all_off\n##########\n##########\n##########\n##########\n##########\n##########\n##########\n##########\n##########\n##########\nall_on\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nOOOOOOOOOO\nsimple\n#O########\nOOO#######\n#O########\n####OO####\n###O##O###\n####OO####\n##########\n########O#\n#######OOO\n########O#\nend\n",
        "output": "all_off 0\nall_on 44\nsimple 4\n"
      }
    ]
  },
  {
    "code": "a583",
    "title": "a583. CPE：Conformity (UVa 11286)",
    "samples": [
      {
        "input": "3\n100 101 102 103 488\n100 200 300 101 102\n103 102 101 488 100\n3\n200 202 204 206 208\n123 234 345 456 321\n100 200 300 400 444\n0\n",
        "output": "2\n3\n"
      }
    ]
  },
  {
    "code": "a584",
    "title": "a584. CPE：Krochanska is Here! (UVa 11792)",
    "samples": [
      {
        "input": "4\n13 3\n1 2 3 4 5 6 7 0\n8 9 4 10 13 0\n11 2 12 9 6 7 0\n6 2\n2 5 3 6 1 4 0\n4 1 6 3 5 2 0\n5 2\n1 2 3 4 5 0\n3 5 1 4 2 0\n7 2\n3 5 1 2 4 7 6 0\n3 6 1 0\n",
        "output": "Krochanska is in: 9\nKrochanska is in: 3\nKrochanska is in: 4\nKrochanska is in: 6\n"
      }
    ]
  },
  {
    "code": "a585",
    "title": "a585. CPE：Uncompress (UVa 245)",
    "samples": [
      {
        "input": "Dear Sally,\nPlease, please do it--1 would 4\nMary very, 1 much. And 4 6\n8 everything in 5's power to make\n14 pay off for you.\n-- Thank 2 18 18--\n0\n",
        "output": "Dear Sally,\nPlease, please do it--it would please\nMary very, very much. And Mary would\ndo everything in Mary's power to make\nit pay off for you.\n-- Thank you very much--\n"
      }
    ]
  },
  {
    "code": "a586",
    "title": "a586. CPE：Number Transformation (UVa 11730)",
    "samples": [
      {
        "input": "6 12\n6 13\n0 0\n",
        "output": "Case 1: 2\nCase 2: -1\n"
      }
    ]
  },
  {
    "code": "a587",
    "title": "a587. CPE：498-bis (UVa 10268)",
    "samples": [
      {
        "input": "7\n1 -1\n2\n1 1 1\n",
        "output": "1\n5\n"
      }
    ]
  },
  {
    "code": "a588",
    "title": "a588. CPE：Erratic Expansion (UVa 12627)",
    "samples": [
      {
        "input": "3\n0 1 1\n3 1 8\n3 3 7\n",
        "output": "Case 1: 1\nCase 2: 27\nCase 3: 14\n"
      }
    ]
  },
  {
    "code": "a589",
    "title": "a589. CPE：Antimonotonicity (UVa 11240)",
    "samples": [
      {
        "input": "4\n5 1 2 3 4 5\n5 5 4 3 2 1\n5 5 1 4 2 3\n5 2 4 1 3 5\n",
        "output": "1\n2\n5\n3\n"
      }
    ]
  },
  {
    "code": "a590",
    "title": "a590. CPE：A Minimum Land Price (UVa 11824)",
    "samples": [
      {
        "input": "3\n7\n2\n10\n0\n20\n29\n31\n0\n42\n41\n40\n37\n20\n0\n",
        "output": "134\n17744\nToo expensive\n"
      }
    ]
  },
  {
    "code": "a591",
    "title": "a591. CPE：Little Red Riding Hood (UVa 11067)",
    "samples": [
      {
        "input": "1 1\n0\n1 1\n2\n0 1\n1 0\n4 4\n3\n0 1\n1 1\n3 1\n10 10\n0\n10 10\n3\n0 1\n1 1\n1 0\n3 3\n5\n1 0\n1 1\n1 2\n2 2\n3 2\n0 0\n",
        "output": "There are 2 paths from Little Red Riding Hood's house to her grandmother's house.\nThere is no path.\nThere are 7 paths from Little Red Riding Hood's house to her grandmother's house.\nThere are 184756 paths from Little Red Riding Hood's house to her grandmother's house.\nThere is no path.\nThere is one path from Little Red Riding Hood's house to her grandmother's house.\n"
      }
    ]
  },
  {
    "code": "a592",
    "title": "a592. CPE：The Eurocup is Here! (UVa 10666)",
    "samples": [
      {
        "input": "4\n3 1\n4 10\n2 2\n4 15\n",
        "output": "2 8\n3 15\n2 3\n5 16\n"
      }
    ]
  },
  {
    "code": "a593",
    "title": "a593. CPE：Predator II (UVa 11030)",
    "samples": [
      {
        "input": "2\n3\n4 1 1 5 1 5 5 1 5\n4 2 2 4 2 4 4 2 4\n3 7 7 10 10 7 10\n1\n3 3 8 9\n1\n4 1 1 10 1 10 10 1 10\n2\n2 2 100 100\n100 100 2 2\n",
        "output": "Case 1:\n3\nCase 2:\n1\n1\n"
      }
    ]
  },
  {
    "code": "a594",
    "title": "a594. CPE：Exchanging Cards (UVa 11678)",
    "samples": [
      {
        "input": "1 1\n1000\n1000\n3 4\n1 3 5\n2 4 6 8\n10 9\n1 1 2 3 5 7 8 8 9 15\n2 2 2 3 4 6 10 11 11\n0 0\n",
        "output": "0\n3\n4\n"
      }
    ]
  },
  {
    "code": "a595",
    "title": "a595. CPE：Alibaba (UVa 1632)",
    "samples": [
      {
        "input": "5\n1 3\n3 1\n5 8\n8 19\n10 15\n5\n1 5\n2 1\n3 4\n4 2\n5 3\n",
        "output": "11\nNo solution\n"
      }
    ]
  },
  {
    "code": "a596",
    "title": "a596. CPE：Largest Square (UVa 10908)",
    "samples": [
      {
        "input": "1\n7 10 4\nabbbaaaaaa\nabbbaaaaaa\nabbbaaaaaa\naaaaaaaaaa\naaaaaaaaaa\naaccaaaaaa\naaccaaaaaa\n1 2\n2 4\n4 6\n5 2\n",
        "output": "7 10 4\n3\n1\n5\n1\n"
      }
    ]
  },
  {
    "code": "a597",
    "title": "a597. CPE：Generate random numbers (UVa 11634)",
    "samples": [
      {
        "input": "5555\n0815\n6239\n0\n",
        "output": "32\n17\n111\n"
      }
    ]
  },
  {
    "code": "a598",
    "title": "a598. CPE：To Add or to Multiply (UVa 1101)",
    "samples": [
      {
        "input": "1 2 2 3 10 20\n1 3 2 3 22 33\n3 2 2 3 4 5\n5 3 2 3 2 3\n0 0 0 0 0 0\n",
        "output": "Case 1: 1A 2M\nCase 2: 1M 2A 1M\nCase 3: impossible\nCase 4: empty\n"
      }
    ]
  },
  {
    "code": "a599",
    "title": "a599. CPE：Bar Codes (UVa 10721)",
    "samples": [
      {
        "input": "7 4 3\n7 4 2\n",
        "output": "16\n4\n"
      }
    ]
  },
  {
    "code": "a600",
    "title": "a600. CPE：Gleaming the Cubes (UVa 737)",
    "samples": [
      {
        "input": "2\n0 0 0 10\n9 1 1 5\n3\n0 0 0 10\n9 1 1 5\n8 2 2 3\n0\n",
        "output": "25\n9\n"
      }
    ]
  },
  {
    "code": "a601",
    "title": "a601. CPE：Scrolling Sign (UVa 11576)",
    "samples": [
      {
        "input": "2\n3 2\nCAT\nTED\n3 3\nCAT\nATE\nTEA\n",
        "output": "5\n5\n"
      }
    ]
  },
  {
    "code": "a602",
    "title": "a602. CPE：The die is cast (UVa 657)",
    "samples": [
      {
        "input": "30 15\n..............................\n..............................\n...............*..............\n...*****......****............\n...*X***.....**X***...........\n...*****....***X**............\n...***X*.....****.............\n...*****.......*..............\n..............................\n........***........******.....\n.......**X****.....*X**X*.....\n......*******......******.....\n.....****X**.......*X**X*.....\n........***........******.....\n..............................\n0 0\n",
        "output": "Throw 1\n1 2 2 4\n\n"
      }
    ]
  },
  {
    "code": "a603",
    "title": "a603. CPE：Dominos 2 (UVa 11518)",
    "samples": [
      {
        "input": "1\n3 2 1\n1 2\n2 3\n2\n",
        "output": "2\n"
      }
    ]
  },
  {
    "code": "a604",
    "title": "a604. CPE：What’s The Frequency, Kenneth? (UVa 499)",
    "samples": [
      {
        "input": "When riding your bicycle backwards down a one-way street, if the\nwheel falls of a canoe, how many ball bearings does it take to fill\nup a water buffalo?\nHello Howard.\n",
        "output": "e 6\nal 7\na 3\nHlo 2\n"
      }
    ]
  },
  {
    "code": "a605",
    "title": "a605. CPE：Fourth Point!! (UVa 10242)",
    "samples": [
      {
        "input": "0.000 0.000 0.000 1.000 0.000 1.000 1.000 1.000\n1.000 0.000 3.500 3.500 3.500 3.500 0.000 1.000\n1.866 0.000 3.127 3.543 3.127 3.543 1.412 3.145\n",
        "output": "1.000 0.000\n-2.500 -2.500\n0.151 -0.398\n"
      }
    ]
  },
  {
    "code": "a606",
    "title": "a606. CPE：Extend to Palindromes (UVa 11475)",
    "samples": [
      {
        "input": "aaaa\nabba\namanaplanacanal\nxyz\n",
        "output": "aaaa\nabba\namanaplanacanalpanama\nxyzyx\n"
      }
    ]
  },
  {
    "code": "a607",
    "title": "a607. CPE：Gondwanaland Telecom (UVa 145)",
    "samples": [
      {
        "input": "A 183-5724 17 58 18 04\n#\n",
        "output": "  183-5724     2     4     0  A    0.44\n"
      }
    ]
  },
  {
    "code": "a608",
    "title": "a608. CPE：Satellites (UVa 10221)",
    "samples": [
      {
        "input": "500 30 deg\n700 60 min\n200 45 deg\n",
        "output": "3633.775503 3592.408346\n124.616509 124.614927\n5215.043805 5082.035982\n"
      }
    ]
  },
  {
    "code": "a609",
    "title": "a609. CPE：Expression Again (UVa 10690)",
    "samples": [
      {
        "input": "2 2\n1 2 3 4\n3 1\n1 2 3 4\n2 2\n2 2 2 2\n",
        "output": "25 21\n24 9\n16 16\n"
      }
    ]
  },
  {
    "code": "a610",
    "title": "a610. CPE：Divide, But Not Quite Conquer! (UVa 10190)",
    "samples": [
      {
        "input": "125 5\n30 3\n80 2\n81 3\n",
        "output": "125 25 5 1\nBoring!\nBoring!\n81 27 9 3 1\n"
      }
    ]
  },
  {
    "code": "a611",
    "title": "a611. CPE：Diatribe against Pigeonholes (UVa 10665)",
    "samples": [
      {
        "input": "4\n5\nBDCECDCBCBCDECDABCEDVBCDBCDBCDABCAED#\n7\nBGFADCEDGFCDEGCFCGDGCXXDAEDACEACEGFAGFCEDGCEDGBCD#\n24\nAABACDEDFGHMMJNTBNHGTDFACCDLLPPPERRAMMMMKKKKJJJHHHAAAAGGGQQQLLLLPPPAA#\n10\nPDJFGEDFANGEHIAEJBHJGEDGJGJEINDFJHEIEDGHFFGHDHGFHAJGIE#\n",
        "output": "C B A E D\n11 8 3 4 9\nC D A B F E G\n10 9 5 2 5 7 9\nA L G D C B E F I O S U V W X N R T Q J K H M P\n11 6 5 4 3 2 2 2 0 0 0 0 0 0 0 2 2 2 3 4 4 5 6 6\nE H D A B C I F J G\n8 7 6 3 1 0 4 6 7 9\n"
      }
    ]
  },
  {
    "code": "a612",
    "title": "a612. CPE：Behold My Quadrangle (UVa 11455)",
    "samples": [
      {
        "input": "4\n10 8 7 6\n9 1 9 1\n29 29 29 29\n5 12 30 7\n",
        "output": "quadrangle\nrectangle\nsquare\nbanana\n"
      }
    ]
  },
  {
    "code": "a613",
    "title": "a613. CPE：Interval Product (UVa 12532)",
    "samples": [
      {
        "input": "4 6\n-2 6 0 -1\nC 1 10\nP 1 4\nC 3 7\nP 2 2\nC 4 -5\nP 1 4\n5 9\n1 5 -2 4 3\nP 1 2\nP 1 5\nC 4 -5\nP 1 5\nP 4 5\nC 3 0\nP 1 5\nC 4 -5\nC 4 -5\n",
        "output": "0+-\n+-+-0\n"
      }
    ]
  },
  {
    "code": "a614",
    "title": "a614. CPE：Doublets (UVa 10150)",
    "samples": [
      {
        "input": "booster\nrooster\nroaster\ncoasted\nroasted\ncoastal\npostal\n\nbooster roasted\ncoastal postal\n",
        "output": "booster\nrooster\nroaster\nroasted\n\nNo solution.\n"
      }
    ]
  },
  {
    "code": "a615",
    "title": "a615. CPE：Optimal Parking (UVa 11364)",
    "samples": [
      {
        "input": "2\n4\n24 13 89 37\n6\n7 30 41 14 39 42\n",
        "output": "152\n70\n"
      }
    ]
  },
  {
    "code": "a616",
    "title": "a616. CPE：Ubiquitous Religions (UVa 10583)",
    "samples": [
      {
        "input": "10 9\n1 2\n1 3\n1 4\n1 5\n1 6\n1 7\n1 8\n1 9\n1 10\n10 4\n2 3\n4 5\n4 8\n5 8\n0 0\n",
        "output": "Case 1: 1\nCase 2: 7\n"
      }
    ]
  },
  {
    "code": "a617",
    "title": "a617. CPE：February 29 (UVa 12439)",
    "samples": [
      {
        "input": "4\nJanuary 12, 2012\nMarch 19, 2012\nAugust 12, 2899\nAugust 12, 2901\nAugust 12, 2000\nAugust 12, 2005\nFebruary 29, 2004\nFebruary 29, 2012\n",
        "output": "Case 1: 1\nCase 2: 0\nCase 3: 1\nCase 4: 3\n"
      }
    ]
  },
  {
    "code": "a618",
    "title": "a618. CPE：DRM (UVa 11336)",
    "samples": [
      {
        "input": "COL1\nBogota Cali\nBogota Barranquilla\n* * *\nCOL2\nBarranquilla Bogota\nArmenia Cali\nBarranquilla Armenia\nBogota Cali\nCali Barrranquilla\n* * *\nCOL1\nBogota Cali\nBogota Barranquilla\n* * *\nCOL3\nBogota Armenia\nArmenia Cali\nCali Medellin\nMedellin Barranquilla\n* * *\nEND\n",
        "output": "YES: COL2 is a more detailed version of COL1\nNO: COL3 is not a more detailed version of COL1\n"
      }
    ]
  },
  {
    "code": "a619",
    "title": "a619. CPE：Wavio Sequence (UVa 10534)",
    "samples": [
      {
        "input": "10\n1 2 3 4 5 4 3 2 1 10\n19\n1 2 3 2 1 2 3 4 3 2 1 5 4 1 2 3 2 2 1\n5\n1 2 3 4 5\n",
        "output": "9\n9\n1\n"
      }
    ]
  },
  {
    "code": "a620",
    "title": "a620. CPE：An Industrial Spy (UVa 12218)",
    "samples": [
      {
        "input": "4\n17\n1276543\n9999999\n011\n",
        "output": "3\n1336\n0\n2\n"
      }
    ]
  },
  {
    "code": "a621",
    "title": "a621. CPE：Shopping Trip (UVa 11284)",
    "samples": [
      {
        "input": "2\n4 5\n0 1 1.00\n1 2 3.00\n1 3 2.00\n2 4 4.00\n3 4 3.25\n3\n2 1.50\n3 7.00\n4 9.00\n1 1\n0 1 1.50\n1\n1 2.99\n",
        "output": "Daniel can save $3.50\nDon't leave the house\n"
      }
    ]
  },
  {
    "code": "a622",
    "title": "a622. CPE：The SetStack Computer (UVa 12096)",
    "samples": [
      {
        "input": "2\n9\nPUSH\nDUP\nADD\nPUSH\nADD\nDUP\nADD\nDUP\nUNION\n5\nPUSH\nPUSH\nADD\nPUSH\nINTERSECT\n",
        "output": "0\n0\n1\n0\n1\n1\n2\n2\n2\n***\n0\n0\n1\n0\n0\n***\n"
      }
    ]
  },
  {
    "code": "a623",
    "title": "a623. CPE：Longest Common Subsequence (UVa 10405)",
    "samples": [
      {
        "input": "bcacbcabbaccbab\nbccabccbbabacbc\na1b2c3d4e\nzz1yy2xx3ww4vv\nabcdgh\naedfhr\nabcdefghijklmnopqrstuvwxyz\na0b0c0d0e0f0g0h0i0j0k0l0m0n0o0p0q0r0s0t0u0v0w0x0y0z0\nabcdefghijklmnzyxwvutsrqpo\nopqrstuvwxyzabcdefghijklmn\n",
        "output": "11\n4\n3\n26\n14\n"
      }
    ]
  },
  {
    "code": "a624",
    "title": "a624. CPE：Deli Deli (UVa 11233)",
    "samples": [
      {
        "input": "3 7\nrice rice\nspaghetti spaghetti\noctopus octopi\nrice\nlobster\nspaghetti\nstrawberry\noctopus\npeach\nturkey\n",
        "output": "rice\nlobsters\nspaghetti\nstrawberries\noctopi\npeaches\nturkeys\n"
      }
    ]
  },
  {
    "code": "a625",
    "title": "a625. CPE：Heavy Cycle Edges (UVa 11747)",
    "samples": [
      {
        "input": "3 3\n0 1 1\n1 2 2\n2 0 3\n4 5\n0 1 1\n1 2 2\n2 3 3\n3 1 4\n0 2 0\n3 1\n0 1 1\n0 0\n",
        "output": "3\n2 4\nforest\n"
      }
    ]
  },
  {
    "code": "a626",
    "title": "a626. CPE：Fire! (UVa 11624)",
    "samples": [
      {
        "input": "2\n4 4\n####\n#JF#\n#..#\n#..#\n3 3\n###\n#J.\n#.F\n",
        "output": "3\nIMPOSSIBLE\n"
      }
    ]
  },
  {
    "code": "a627",
    "title": "a627. CPE：From D to E and back (UVa 11175)",
    "samples": [
      {
        "input": "4\n2\n1\n0 1\n5\n0\n4\n3\n0 1\n2 1\n2 3\n3\n9\n0 1\n0 2\n1 2\n1 0\n2 0\n2 1\n0 0\n1 1\n2 2\n",
        "output": "Case #1: Yes\nCase #2: Yes\nCase #3: No\nCase #4: Yes\n"
      }
    ]
  },
  {
    "code": "a628",
    "title": "a628. CPE：String Partition (UVa 11258)",
    "samples": [
      {
        "input": "6\n1234554321\n5432112345\n000\n121212121212\n2147483648\n11111111111111111111111111111111111111111111111111111\n",
        "output": "1234554321\n543211239\n0\n2121212124\n214748372\n5555555666\n"
      }
    ]
  },
  {
    "code": "a629",
    "title": "a629. CPE：Sumsets (UVa 10125)",
    "samples": [
      {
        "input": "5\n2\n3\n5\n7\n12\n5\n2\n16\n64\n256\n1024\n0\n",
        "output": "12\nno solution\n"
      }
    ]
  },
  {
    "code": "a630",
    "title": "a630. CPE：Continents (UVa 11094)",
    "samples": [
      {
        "input": "5 5\nwwwww\nwwllw\nwwwww\nwllww\nwwwww\n1 3\n",
        "output": "2\n"
      }
    ]
  },
  {
    "code": "a631",
    "title": "a631. CPE：Euclid Problem (UVa 10104)",
    "samples": [
      {
        "input": "4 6\n17 17\n",
        "output": "-1 1 2\n0 1 17\n"
      }
    ]
  },
  {
    "code": "a632",
    "title": "a632. CPE：Almost Prime Numbers (UVa 10539)",
    "samples": [
      {
        "input": "3\n1 10\n1 20\n1 5\n",
        "output": "3\n4\n1\n"
      }
    ]
  },
  {
    "code": "a633",
    "title": "a633. CPE：B2-Sequence (UVa 11063)",
    "samples": [
      {
        "input": "4\n1 2 4 8\n4\n3 7 10 14\n",
        "output": "Case #1: It is a B2-Sequence.\n\nCase #2: It is not a B2-Sequence.\n\n"
      }
    ]
  },
  {
    "code": "a634",
    "title": "a634. CPE：Marbles (UVa 10090)",
    "samples": [
      {
        "input": "43\n1 3\n2 4\n40\n5 9\n5 12\n0\n",
        "output": "13 1\nfailed\n"
      }
    ]
  },
  {
    "code": "a635",
    "title": "a635. CPE：Joseph’s Cousin (UVa 10015)",
    "samples": [
      {
        "input": "6\n0\n",
        "output": "4\n"
      }
    ]
  },
  {
    "code": "a636",
    "title": "a636. CPE：Cheapest Base (UVa 11005)",
    "samples": [
      {
        "input": "2\n10 8 12 13 15 13 13 16 9\n11 18 24 21 23 23 23 13 15\n17 33 21 23 27 26 27 19 4\n22 18 30 30 24 16 26 21 21\n5\n98329921\n12345\n800348\n14\n873645\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1\n4\n0\n1\n10\n100\n",
        "output": "Case 1:\nCheapest base(s) for number 98329921: 24\nCheapest base(s) for number 12345: 13 31\nCheapest base(s) for number 800348: 31\nCheapest base(s) for number 14: 13\nCheapest base(s) for number 873645: 22\n\nCase 2:\nCheapest base(s) for number 0: 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36\nCheapest base(s) for number 1: 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36\nCheapest base(s) for number 10: 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36\nCheapest base(s) for number 100: 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36\n"
      }
    ]
  },
  {
    "code": "a637",
    "title": "a637. CPE：Take the Land (UVa 10074)",
    "samples": [
      {
        "input": "6 7\n0 1 1 0 1 1 0\n0 0 0 0 0 1 0\n1 0 0 0 0 0 1\n0 1 0 0 0 0 1\n1 1 0 0 0 1 0\n1 1 0 1 1 0 0\n0 0\n",
        "output": "12\n"
      }
    ]
  },
  {
    "code": "a638",
    "title": "a638. CPE：Arctic Network (UVa 10369)",
    "samples": [
      {
        "input": "1\n2 4\n0 100\n0 300\n0 600\n150 750\n",
        "output": "212.13\n"
      }
    ]
  },
  {
    "code": "a639",
    "title": "a639. CPE：Password (UVa 1262)",
    "samples": [
      {
        "input": "3\n1\nAYGSU\nDOMRA\nCPFAS\nXBODG\nWDYPK\nPRXWO\nCBOPT\nDOSBG\nGTRAR\nAPMMS\nWSXNU\nEFGHI\n5\nAYGSU\nDOMRA\nCPFAS\nXBODG\nWDYPK\nPRXWO\nCBOPT\nDOSBG\nGTRAR\nAPMMS\nWSXNU\nEFGHI\n64\nFGHIJ\nEFGHI\nDEFGH\nCDEFG\nBCDEF\nABCDE\nWBXDY\nUWYXZ\nXXZFG\nYYFYH\nEZWZI\nZGHIJ\n",
        "output": "ABGAG\nABGPS\nNO\n"
      }
    ]
  },
  {
    "code": "a640",
    "title": "a640. CPE：Winterim Backpacking Trip (UVa 907)",
    "samples": [
      {
        "input": "4 3\n7\n2\n6\n4\n5\n",
        "output": "8\n"
      }
    ]
  },
  {
    "code": "a641",
    "title": "a641. CPE：What is the Probability? (UVa 10056)",
    "samples": [
      {
        "input": "2\n2 0.166666 1\n2 0.166666 2\n",
        "output": "0.5455\n0.4545\n"
      }
    ]
  },
  {
    "code": "a642",
    "title": "a642. CPE：Simple Addition (UVa 10994)",
    "samples": [
      {
        "input": "1 10\n10 20\n30 40\n-1 -1\n",
        "output": "46\n48\n52\n"
      }
    ]
  },
  {
    "code": "a643",
    "title": "a643. CPE：Jogging Trails (UVa 10296)",
    "samples": [
      {
        "input": "4 5\n1 2 3\n2 3 4\n3 4 5\n1 4 10\n1 3 12\n0\n",
        "output": "41\n"
      }
    ]
  },
  {
    "code": "a644",
    "title": "a644. CPE：The Priest Mathematician (UVa 10254)",
    "samples": [
      {
        "input": "1\n2\n28\n64\n",
        "output": "1\n3\n769\n18433\n"
      }
    ]
  },
  {
    "code": "a645",
    "title": "a645. CPE：Shoemaker’s problem (UVa 10026)",
    "samples": [
      {
        "input": "1\n4\n3 4\n1 1000\n2 2\n5 5\n",
        "output": "2 1 3 4\n"
      }
    ]
  },
  {
    "code": "a646",
    "title": "a646. CPE：You can say 11 (UVa 10929)",
    "samples": [
      {
        "input": "112233\n30800\n2937\n323455693\n5038297\n112234\n0\n",
        "output": "112233 is a multiple of 11.\n30800 is a multiple of 11.\n2937 is a multiple of 11.\n323455693 is a multiple of 11.\n5038297 is a multiple of 11.\n112234 is not a multiple of 11.\n"
      }
    ]
  },
  {
    "code": "a647",
    "title": "a647. CPE：Modular Fibonacci (UVa 10229)",
    "samples": [
      {
        "input": "11 7\n11 6\n",
        "output": "89\n25\n"
      }
    ]
  },
  {
    "code": "a648",
    "title": "a648. CPE：Add bricks in the wall (UVa 11040)",
    "samples": [
      {
        "input": "2\n255\n54 67\n10 18 13\n3 3 5 2\n2 1 2 1 1\n256\n64 64\n16 16 16\n4 4 4 4\n1 1 1 1 1\n",
        "output": "255\n121 134\n54 67 67\n23 31 36 31\n10 13 18 18 13\n5 5 8 10 8 5\n3 2 3 5 5 3 2\n2 1 1 2 3 2 1 1\n2 0 1 0 2 1 1 0 1\n256\n128 128\n64 64 64\n32 32 32 32\n16 16 16 16 16\n8 8 8 8 8 8\n4 4 4 4 4 4 4\n2 2 2 2 2 2 2 2\n1 1 1 1 1 1 1 1 1\n"
      }
    ]
  },
  {
    "code": "a649",
    "title": "a649. CPE：Reverse and Add (UVa 10018)",
    "samples": [
      {
        "input": "3\n195\n265\n750\n",
        "output": "4 9339\n5 45254\n3 6666\n"
      }
    ]
  },
  {
    "code": "a650",
    "title": "a650. CPE：(2/3/4)-D Sqr/Rects/Cubes/Boxes? (UVa 10177)",
    "samples": [
      {
        "input": "1\n2\n3\n",
        "output": "1 0 1 0 1 0\n5 4 9 18 17 64\n14 22 36 180 98 1198\n"
      }
    ]
  },
  {
    "code": "a651",
    "title": "a651. CPE：Children’s Game (UVa 10905)",
    "samples": [
      {
        "input": "4\n123 124 56 90\n5\n123 124 56 90 9\n5\n9 9 9 9 9\n0\n",
        "output": "9056124123\n99056124123\n99999\n"
      }
    ]
  },
  {
    "code": "a652",
    "title": "a652. CPE：Chess Queen (UVa 11538)",
    "samples": [
      {
        "input": "2 2\n100 223\n2300 1000\n0 0\n",
        "output": "12\n10907100\n11514134000\n"
      }
    ]
  },
  {
    "code": "a653",
    "title": "a653. CPE：Bicoloring (UVa 10004)",
    "samples": [
      {
        "input": "3\n3\n0 1\n1 2\n2 0\n3\n2\n0 1\n1 2\n9\n8\n0 1\n0 2\n0 3\n0 4\n0 5\n0 6\n0 7\n0 8\n0\n",
        "output": "NOT BICOLORABLE.\nBICOLORABLE.\nBICOLORABLE.\n"
      }
    ]
  },
  {
    "code": "a654",
    "title": "a654. CPE：Traditional BINGO (UVa 10813)",
    "samples": [
      {
        "input": "1\n10 17 39 49 64\n12 21 36 55 62\n14 25 52 70\n7 19 32 56 68\n5 24 34 54 71\n1 2 3 4 5 6 7 8 9 10\n11 12 13 14 15 16 17 18 19 20\n21 22 23 24 25 26 27 28 29 30\n31 32 33 34 35 36 37 38 39 40\n41 42 43 44 45 46 47 48 49 50\n51 52 53 54 55 56 57 58 59 60\n61 62 63 64 65 66 67 68 69 70\n71 72 73 74 75\n",
        "output": "BINGO after 14 numbers announced\n"
      }
    ]
  },
  {
    "code": "a655",
    "title": "a655. CPE：Bubbles and Buckets (UVa 11495)",
    "samples": [
      {
        "input": "5 1 5 3 4 2\n5 5 1 3 4 2\n5 1 2 3 4 5\n6 3 5 2 1 4 6\n5 5 4 3 2 1\n6 6 5 4 3 2 1\n0\n",
        "output": "Marcelo\nCarlos\nCarlos\nCarlos\nCarlos\nMarcelo\n"
      }
    ]
  },
  {
    "code": "a656",
    "title": "a656. CPE：Cable TV Network (UVa 1660)",
    "samples": [
      {
        "input": "0 0\n1 0\n3 3 (0,1) (0,2) (1,2)\n2 0\n5 7 (0,1) (0,2) (1,3) (1,2) (1,4) (2,3) (3,4)\n",
        "output": "0\n1\n3\n0\n2\n"
      }
    ]
  },
  {
    "code": "a657",
    "title": "a657. CPE：Odd Sum (UVa 10783)",
    "samples": [
      {
        "input": "2\n1\n5\n3\n5\n",
        "output": "Case 1: 9\nCase 2: 8\n"
      }
    ]
  },
  {
    "code": "a658",
    "title": "a658. CPE：The Counting Problem (UVa 1640)",
    "samples": [
      {
        "input": "1 10\n44 497\n346 542\n1199 1748\n1496 1403\n1004 503\n1714 190\n1317 854\n1976 494\n1001 1960\n0 0\n",
        "output": "1 2 1 1 1 1 1 1 1 1\n85 185 185 185 190 96 96 96 95 93\n40 40 40 93 136 82 40 40 40 40\n115 666 215 215 214 205 205 154 105 106\n16 113 19 20 114 20 20 19 19 16\n107 105 100 101 101 197 200 200 200 200\n413 1133 503 503 503 502 502 417 402 412\n196 512 186 104 87 93 97 97 142 196\n398 1375 398 398 405 499 499 495 488 471\n294 1256 296 296 296 296 287 286 286 247\n"
      }
    ]
  },
  {
    "code": "a659",
    "title": "a659. CPE：Triangle Counting (UVa 11401)",
    "samples": [
      {
        "input": "5\n8\n0\n",
        "output": "3\n22\n"
      }
    ]
  },
  {
    "code": "a660",
    "title": "a660. CPE：Ant on a Chessboard (UVa 10161)",
    "samples": [
      {
        "input": "8\n20\n25\n0\n",
        "output": "2 3\n5 4\n1 5\n"
      }
    ]
  },
  {
    "code": "a661",
    "title": "a661. CPE：Throwing cards away I (UVa 10935)",
    "samples": [
      {
        "input": "7\n19\n10\n6\n0\n",
        "output": "Discarded cards: 1, 3, 5, 7, 4, 2\nRemaining card: 6\nDiscarded cards: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 4, 8, 12, 16, 2, 10, 18, 14\nRemaining card: 6\nDiscarded cards: 1, 3, 5, 7, 9, 2, 6, 10, 8\nRemaining card: 4\nDiscarded cards: 1, 3, 5, 2, 6\nRemaining card: 4\n"
      }
    ]
  },
  {
    "code": "a662",
    "title": "a662. CPE：Bit Mask (UVa 10718)",
    "samples": [
      {
        "input": "100 50 60\n100 50 50\n100 0 100\n1 0 100\n15 1 15\n",
        "output": "59\n50\n27\n100\n1\n"
      }
    ]
  },
  {
    "code": "a663",
    "title": "a663. CPE：The Trip (UVa 10137)",
    "samples": [
      {
        "input": "3\n10.00\n20.00\n30.00\n4\n15.00\n15.01\n3.00\n3.01\n0\n",
        "output": "$10.00\n$11.99\n"
      }
    ]
  },
  {
    "code": "a664",
    "title": "a664. CPE：Prince and Princess (UVa 10635)",
    "samples": [
      {
        "input": "1\n3 6 7\n1 7 5 4 8 3 9\n1 4 3 5 6 2 8 9\n",
        "output": "Case 1: 4\n"
      }
    ]
  },
  {
    "code": "a665",
    "title": "a665. CPE：DNA Consensus String (UVa 1368)",
    "samples": [
      {
        "input": "3\n5 8\nTATGATAC\nTAAGCTAC\nAAAGATCC\nTGAGATAC\nTAAGATGT\n4 10\nACGTACGTAC\nCCGTACGTAG\nGCGTACGTAT\nTCGTACGTAA\n6 10\nATGTTACCAT\nAAGTTACGAT\nAACAAAGCAA\nAAGTTACCTT\nAAGTTACCAA\nTACTTACCAA\n",
        "output": "TAAGATAC\n7\nACGTACGTAA\n6\nAAGTTACCAA\n12\n"
      }
    ]
  },
  {
    "code": "a666",
    "title": "a666. CPE：The Tourist Guide (UVa 10099)",
    "samples": [
      {
        "input": "7 10\n1 2 30\n1 3 15\n1 4 10\n2 4 25\n2 5 60\n3 4 40\n3 6 20\n4 7 35\n5 7 20\n6 7 30\n1 7 99\n0 0\n",
        "output": "Scenario #1\nMinimum Number of Trips = 5\n\n"
      }
    ]
  },
  {
    "code": "a667",
    "title": "a667. CPE：Closest Sums (UVa 10487)",
    "samples": [
      {
        "input": "5\n3\n12\n17\n33\n34\n3\n1\n51\n30\n3\n1\n2\n3\n3\n1\n2\n3\n3\n1\n2\n3\n3\n4\n5\n6\n0\n",
        "output": "Case 1:\nClosest sum to 1 is 15.\nClosest sum to 51 is 51.\nClosest sum to 30 is 29.\nCase 2:\nClosest sum to 1 is 3.\nClosest sum to 2 is 3.\nClosest sum to 3 is 3.\nCase 3:\nClosest sum to 4 is 4.\nClosest sum to 5 is 5.\nClosest sum to 6 is 5.\n"
      }
    ]
  },
  {
    "code": "a668",
    "title": "a668. CPE：Strategic game (UVa 1292)",
    "samples": [
      {
        "input": "4\n0:(1) 1\n1:(2) 2 3\n2:(0)\n3:(0)\n5\n3:(3) 1 4 2\n1:(1) 0\n2:(0)\n0:(0)\n4:(0)\n",
        "output": "1\n2\n"
      }
    ]
  },
  {
    "code": "a669",
    "title": "a669. CPE：The jackpot (UVa 10684)",
    "samples": [
      {
        "input": "5\n12 -4\n-10 4\n9\n3\n-2 -1 -2\n0\n",
        "output": "The maximum winning streak is 13.\nLosing streak.\n"
      }
    ]
  },
  {
    "code": "a670",
    "title": "a670. CPE：WERTYU (UVa 10082)",
    "samples": [
      {
        "input": "O S, GOMR YPFSU/\n",
        "output": "I AM FINE TODAY.\n"
      }
    ]
  },
  {
    "code": "a671",
    "title": "a671. CPE：Prime Time (UVa 10200)",
    "samples": [
      {
        "input": "0 39\n0 40\n39 40\n",
        "output": "100.00\n97.56\n50.00\n"
      }
    ]
  },
  {
    "code": "a672",
    "title": "a672. CPE：RACING (UVa 1234)",
    "samples": [
      {
        "input": "1\n6 7\n1 2 5\n2 3 3\n1 4 5\n4 5 4\n5 6 4\n6 3 3\n5 2 3\n0\n",
        "output": "6\n"
      }
    ]
  },
  {
    "code": "a673",
    "title": "a673. CPE：Luggage (UVa 10664)",
    "samples": [
      {
        "input": "3\n1 2 1 2 1\n2 3 4 1 2 5 10 50 3 50\n3 5 2 7 1 7 5 2 8 9 1 25 15 8 3 1 38 45 8 1\n",
        "output": "NO\nYES\nYES\n"
      }
    ]
  },
  {
    "code": "a674",
    "title": "a674. CPE：Divisibility (UVa 10036)",
    "samples": [
      {
        "input": "2\n4 7\n17 5 -21 15\n4 5\n17 5 -21 15\n",
        "output": "Divisible\nNot divisible\n"
      }
    ]
  },
  {
    "code": "a675",
    "title": "a675. CPE：The Twin Towers (UVa 10066)",
    "samples": [
      {
        "input": "7 6\n20 15 10 15 25 20 15\n15 25 10 20 15 20\n8 9\n10 20 20 10 20 10 20 10\n20 10 20 10 10 20 10 10 20\n0 0\n",
        "output": "Twin Towers #1\nNumber of Tiles : 4\n\nTwin Towers #2\nNumber of Tiles : 6\n\n"
      }
    ]
  },
  {
    "code": "a676",
    "title": "a676. CPE：AGTC (UVa 1207)",
    "samples": [
      {
        "input": "10 AGTCTGACGC\n11 AGTAAGTAGGC\n",
        "output": "4\n"
      }
    ]
  },
  {
    "code": "a677",
    "title": "a677. CPE：Buying Coke (UVa 10626)",
    "samples": [
      {
        "input": "3\n2 2 1 1\n2 1 4 1\n20 200 3 0\n",
        "output": "5\n3\n148\n"
      }
    ]
  },
  {
    "code": "a678",
    "title": "a678. CPE：Team Queue (UVa 540)",
    "samples": [
      {
        "input": "2\n3 101 102 103\n3 201 202 203\nENQUEUE 101\nENQUEUE 201\nENQUEUE 102\nENQUEUE 202\nENQUEUE 103\nENQUEUE 203\nDEQUEUE\nDEQUEUE\nDEQUEUE\nDEQUEUE\nDEQUEUE\nDEQUEUE\nSTOP\n2\n5 259001 259002 259003 259004 259005\n6 260001 260002 260003 260004 260005 260006\nENQUEUE 259001\nENQUEUE 260001\nENQUEUE 259002\nENQUEUE 259003\nENQUEUE 259004\nENQUEUE 259005\nDEQUEUE\nDEQUEUE\nENQUEUE 260002\nENQUEUE 260003\nDEQUEUE\nDEQUEUE\nDEQUEUE\nDEQUEUE\nSTOP\n0\n",
        "output": "Scenario #1\n101\n102\n103\n201\n202\n203\n\nScenario #2\n259001\n259002\n259003\n259004\n259005\n260001\n\n"
      }
    ]
  },
  {
    "code": "a679",
    "title": "a679. CPE：Binary Stirling Numbers (UVa 1118)",
    "samples": [
      {
        "input": "1\n4 2\n",
        "output": "1\n"
      }
    ]
  },
  {
    "code": "a680",
    "title": "a680. CPE：Fibonacci Numbers (UVa 10579)",
    "samples": [
      {
        "input": "3\n100\n",
        "output": "2\n354224848179261915075\n"
      }
    ]
  },
  {
    "code": "a681",
    "title": "a681. CPE：Smith Numbers (UVa 10042)",
    "samples": [
      {
        "input": "1\n4937774\n",
        "output": "4937775\n"
      }
    ]
  },
  {
    "code": "a682",
    "title": "a682. CPE：Digit Primes (UVa 10533)",
    "samples": [
      {
        "input": "3\n10 20\n10 100\n100 10000\n",
        "output": "1\n10\n576\n"
      }
    ]
  },
  {
    "code": "a683",
    "title": "a683. CPE：Circular (UVa 967)",
    "samples": [
      {
        "input": "1000 1100\n100 120\n100 1000\n-1\n",
        "output": "No Circular Primes.\n1 Circular Prime.\n12 Circular Primes.\n"
      }
    ]
  },
  {
    "code": "a684",
    "title": "a684. CPE：Minimal coverage (UVa 10020)",
    "samples": [
      {
        "input": "2\n\n1\n-1 0\n-5 -3\n2 5\n0 0\n\n1\n-1 0\n0 1\n0 0\n",
        "output": "0\n\n1\n0 1\n"
      }
    ]
  },
  {
    "code": "a685",
    "title": "a685. CPE：Intersecting Lines (UVa 378)",
    "samples": [
      {
        "input": "5\n0 0 4 4 0 4 4 0\n5 0 7 6 1 0 2 3\n5 0 7 6 3 -6 4 -3\n2 0 2 27 1 5 18 5\n0 3 4 0 1 2 2 5\n",
        "output": "INTERSECTING LINES OUTPUT\nPOINT 2.00 2.00\nNONE\nLINE\nPOINT 2.00 5.00\nPOINT 1.07 2.20\nEND OF OUTPUT\n"
      }
    ]
  },
  {
    "code": "a686",
    "title": "a686. CPE：Steps (UVa 846)",
    "samples": [
      {
        "input": "3\n45 48\n45 49\n45 50\n",
        "output": "3\n3\n4\n"
      }
    ]
  },
  {
    "code": "a687",
    "title": "a687. CPE：How Big Is It? (UVa 10012)",
    "samples": [
      {
        "input": "3\n3 2.0 1.0 2.0\n4 2.0 2.0 2.0 2.0\n3 2.0 1.0 4.0\n",
        "output": "9.657\n16.000\n12.657\n"
      }
    ]
  },
  {
    "code": "a688",
    "title": "a688. CPE：History Grading (UVa 111)",
    "samples": [
      {
        "input": "4\n4 2 3 1\n1 3 2 4\n3 2 1 4\n2 3 4 1\n10\n3 1 2 4 9 5 10 6 8 7\n1 2 3 4 5 6 7 8 9 10\n4 7 2 3 10 6 9 1 5 8\n3 1 2 4 9 5 10 6 8 7\n2 10 1 3 8 4 9 5 7 6\n",
        "output": "1\n2\n3\n6\n5\n10\n9\n"
      }
    ]
  },
  {
    "code": "a689",
    "title": "a689. CPE：Homer Simpson (UVa 10465)",
    "samples": [
      {
        "input": "3 5 54\n3 5 55\n",
        "output": "18\n17\n"
      }
    ]
  },
  {
    "code": "a690",
    "title": "a690. CPE：Internet Bandwidth (UVa 820)",
    "samples": [
      {
        "input": "4\n1 4 5\n1 2 20\n1 3 10\n2 3 5\n2 4 10\n3 4 20\n0\n",
        "output": "Network 1\nThe bandwidth is 25.\n\n"
      }
    ]
  },
  {
    "code": "a691",
    "title": "a691. CPE：Sum of MSLCM (UVa 1730)",
    "samples": [
      {
        "input": "10\n1000\n0\n",
        "output": "86\n823080\n"
      }
    ]
  },
  {
    "code": "a692",
    "title": "a692. CPE：Unique Factorization (UVa 10858)",
    "samples": [
      {
        "input": "1\n20\n0\n",
        "output": "0\n3\n2 2 5\n2 10\n4 5\n"
      }
    ]
  },
  {
    "code": "a693",
    "title": "a693. CPE：Exponentiation (UVa 748)",
    "samples": [
      {
        "input": "95.123 12\n0.4321 20\n5.1234 15\n6.7592 9\n98.999 10\n1.0100 12\n",
        "output": "548815620517731830194541.899025343415715973535967221869852721\n.00000005148554641076956121994511276767154838481760200726351203835429763013462401\n43992025569.928573701266488041146654993318703707511666295476720493953024\n29448126.764121021618164430206909037173276672\n90429072743629540498.107596019456651774561044010001\n1.126825030131969720661201\n"
      }
    ]
  },
  {
    "code": "a694",
    "title": "a694. CPE：Eb Alto Saxophone Player (UVa 10415)",
    "samples": [
      {
        "input": "3\ncdefgab\nBAGFEDC\nCbCaDCbCbCCbCbabCCbCbabae\n",
        "output": "0 1 1 1 0 0 1 1 1 1\n1 1 1 1 0 0 1 1 1 0\n1 8 10 2 0 0 2 2 1 0\n"
      }
    ]
  },
  {
    "code": "a695",
    "title": "a695. CPE：Number String (UVa 1650)",
    "samples": [
      {
        "input": "II\nID\nDI\nDD\n?D\n??\n",
        "output": "1\n2\n2\n1\n3\n6\n"
      }
    ]
  },
  {
    "code": "a696",
    "title": "a696. CPE：Argus (UVa 1203)",
    "samples": [
      {
        "input": "Register 2004 200\nRegister 2005 300\n#\n5\n",
        "output": "2004\n2005\n2004\n2004\n2005\n"
      }
    ]
  },
  {
    "code": "a697",
    "title": "a697. CPE：How Many Knights (UVa 696)",
    "samples": [
      {
        "input": "2 3\n5 5\n4 7\n0 0\n",
        "output": "4 knights may be placed on a 2 row 3 column board.\n13 knights may be placed on a 5 row 5 column board.\n14 knights may be placed on a 4 row 7 column board.\n"
      }
    ]
  },
  {
    "code": "a698",
    "title": "a698. CPE：Bachet’s Game (UVa 10404)",
    "samples": [
      {
        "input": "20 3 1 3 8\n21 3 1 3 8\n22 3 1 3 8\n23 3 1 3 8\n1000000 10 1 23 38 11 7 5 4 8 3 13\n999996 10 1 23 38 11 7 5 4 8 3 13\n",
        "output": "Stan wins\nStan wins\nOllie wins\nStan wins\nStan wins\nOllie wins\n"
      }
    ]
  },
  {
    "code": "a699",
    "title": "a699. CPE：I Can Guess the Data Structure! (UVa 11995)",
    "samples": [
      {
        "input": "6\n1 1\n1 2\n1 3\n2 1\n2 2\n2 3\n6\n1 1\n1 2\n1 3\n2 3\n2 2\n2 1\n2\n1 1\n2 2\n4\n1 2\n1 1\n2 1\n2 2\n7\n1 2\n1 5\n1 1\n1 3\n2 5\n1 4\n2 4\n",
        "output": "queue\nnot sure\nimpossible\nstack\npriority queue\n"
      }
    ]
  },
  {
    "code": "a700",
    "title": "a700. CPE：Square (UVa 10364)",
    "samples": [
      {
        "input": "3\n4 1 1 1 1\n5 10 20 30 40 50\n8 1 7 2 6 4 4 3 5\n",
        "output": "yes\nno\nyes\n"
      }
    ]
  },
  {
    "code": "a701",
    "title": "a701. CPE：Ducci Sequence (UVa 1594)",
    "samples": [
      {
        "input": "4\n4\n8 11 2 7\n5\n4 2 0 2 0\n7\n0 0 0 0 0 0 0\n6\n1 2 3 1 2 3\n",
        "output": "ZERO\nLOOP\nZERO\nLOOP\n"
      }
    ]
  },
  {
    "code": "a702",
    "title": "a702. CPE：DNA Sorting (UVa 612)",
    "samples": [
      {
        "input": "1\n10 6\nAACATGAAGG\nTTTTGGCCAA\nTTTGGCCAAA\nGATCAGATTT\nCCCGGGGGGA\nATCGATGCAT\n",
        "output": "CCCGGGGGGA\nAACATGAAGG\nGATCAGATTT\nATCGATGCAT\nTTTTGGCCAA\nTTTGGCCAAA\n"
      }
    ]
  },
  {
    "code": "a703",
    "title": "a703. CPE：Sort! Sort!! And Sort!!! (UVa 11321)",
    "samples": [
      {
        "input": "15 3\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n0 0\n",
        "output": "15 3\n15\n9\n3\n6\n12\n13\n7\n1\n4\n10\n11\n5\n2\n8\n14\n0 0\n"
      }
    ]
  },
  {
    "code": "a704",
    "title": "a704. CPE：Movie collection (UVa 1513)",
    "samples": [
      {
        "input": "2\n3 3\n3 1 1\n5 3\n4 4 5\n",
        "output": "2 1 0\n3 0 4\n"
      }
    ]
  },
  {
    "code": "a705",
    "title": "a705. CPE：The Polynomial Equation (UVa 10326)",
    "samples": [
      {
        "input": "2\n2 3\n2\n-2 -3\n3\n0 1 -1\n",
        "output": "x^2 - 5x + 6 = 0\nx^2 + 5x + 6 = 0\nx^3 - x + 0 = 0\n"
      }
    ]
  },
  {
    "code": "a706",
    "title": "a706. CPE：Rank the Languages (UVa 10336)",
    "samples": [
      {
        "input": "2\n4 8\nttuuttdd\nttuuttdd\nuuttuudd\nuuttuudd\n9 9\nbbbbbbbbb\naaaaaaaab\nbbbbbbbab\nbaaaaacab\nbacccccab\nbacbbbcab\nbacccccab\nbaaaaaaab\nbbbbbbbbb\n",
        "output": "World #1\nt: 3\nu: 3\nd: 1\nWorld #2\nb: 2\na: 1\nc: 1\n"
      }
    ]
  },
  {
    "code": "a707",
    "title": "a707. CPE：The Snail (UVa 573)",
    "samples": [
      {
        "input": "6 3 1 10\n10 2 1 50\n50 5 3 14\n50 6 4 1\n50 6 3 1\n1 1 1 1\n0 0 0 0\n",
        "output": "success on day 3\nfailure on day 4\nfailure on day 7\nfailure on day 68\nsuccess on day 20\nfailure on day 2\n"
      }
    ]
  },
  {
    "code": "a708",
    "title": "a708. CPE：Bangla Numbers (UVa 10101)",
    "samples": [
      {
        "input": "23764\n45897458973958\n",
        "output": "   1. 23 hajar 7 shata 64\n   2. 45 lakh 89 hajar 7 shata 45 kuti 89 lakh 73 hajar 9 shata 58\n"
      }
    ]
  },
  {
    "code": "a709",
    "title": "a709. CPE：Ancient Cipher (UVa 1339)",
    "samples": [
      {
        "input": "JWPUDJSTVP\nVICTORIOUS\nMAMA\nROME\nHAHA\nHEHE\nAAA\nAAA\nNEERCISTHEBEST\nSECRETMESSAGES\n",
        "output": "YES\nNO\nYES\nYES\nNO\n"
      }
    ]
  },
  {
    "code": "a710",
    "title": "a710. CPE：Error Correction (UVa 541)",
    "samples": [
      {
        "input": "4\n1 0 1 0\n0 0 0 0\n1 1 1 1\n0 1 0 1\n4\n1 0 1 0\n0 0 1 0\n1 1 1 1\n0 1 0 1\n4\n1 0 1 0\n0 1 1 0\n1 1 1 1\n0 1 0 1\n0\n",
        "output": "OK\nChange bit (2,3)\nCorrupt\n"
      }
    ]
  },
  {
    "code": "a711",
    "title": "a711. CPE：Hartals (UVa 10050)",
    "samples": [
      {
        "input": "2\n14\n3\n3\n4\n8\n100\n4\n12\n15\n25\n40\n",
        "output": "5\n15\n"
      }
    ]
  },
  {
    "code": "a712",
    "title": "a712. CPE：Eat or not to Eat? (UVa 10273)",
    "samples": [
      {
        "input": "1\n4\n4 7 1 2 9\n1 2\n2 7 1\n1 2\n",
        "output": "2 6\n"
      }
    ]
  },
  {
    "code": "a713",
    "title": "a713. CPE：Dungeon Master (UVa 532)",
    "samples": [
      {
        "input": "3 4 5\nS....\n.###.\n.##..\n###.#\n#####\n#####\n##.##\n##...\n#####\n#####\n#.###\n####E\n1 3 3\nS##\n#E#\n###\n0 0 0\n",
        "output": "Escaped in 11 minute(s).\nTrapped!\n"
      }
    ]
  },
  {
    "code": "a714",
    "title": "a714. CPE：Sum of Consecutive Prime Numbers (UVa 1210)",
    "samples": [
      {
        "input": "2\n3\n17\n41\n20\n666\n12\n53\n0\n",
        "output": "1\n1\n2\n3\n0\n0\n1\n2\n"
      }
    ]
  },
  {
    "code": "a715",
    "title": "a715. CPE：Oil Deposits (UVa 572)",
    "samples": [
      {
        "input": "1 1\n*\n3 5\n*@*@*\n**@**\n*@*@*\n1 8\n@@****@*\n5 5\n****@\n*@@*@\n*@**@\n@@@*@\n@@**@\n0 0\n",
        "output": "0\n1\n2\n2\n"
      }
    ]
  },
  {
    "code": "a716",
    "title": "a716. CPE：Common Permutation (UVa 10252)",
    "samples": [
      {
        "input": "pretty\nwomen\nwalking\ndown\nthe\nstreet\n",
        "output": "e\nnw\net\n"
      }
    ]
  },
  {
    "code": "a717",
    "title": "a717. CPE：Black Box (UVa 501)",
    "samples": [
      {
        "input": "1\n7 4\n3 1 -4 2 8 -1000 2\n1 2 6 6\n",
        "output": "3\n3\n1\n2\n"
      }
    ]
  },
  {
    "code": "a718",
    "title": "a718. CPE：A DP Problem (UVa 1200)",
    "samples": [
      {
        "input": "2\n2x-4+5x+300=98x\nx+2=2+x\n",
        "output": "3\nIDENTITY\n"
      }
    ]
  },
  {
    "code": "a719",
    "title": "a719. CPE：Decode the Mad man (UVa 10222)",
    "samples": [
      {
        "input": "k[r dyt I[o\n",
        "output": "how are you\n"
      }
    ]
  },
  {
    "code": "a720",
    "title": "a720. CPE：Longest Nap (UVa 10191)",
    "samples": [
      {
        "input": "4\n10:00 12:00 Lectures\n12:00 13:00 Lunch, like always.\n13:00 15:00 Boring lectures...\n15:30 17:45 Reading\n4\n10:00 12:00 Lectures\n12:00 13:00 Lunch, just lunch.\n13:00 15:00 Lectures, lectures... oh, no!\n16:45 17:45 Reading (to be or not to be?)\n4\n10:00 12:00 Lectures, as everyday.\n12:00 13:00 Lunch, again!!!\n13:00 15:00 Lectures, more lectures!\n15:30 17:15 Reading (I love reading, but should I schedule it?)\n1\n12:00 13:00 I love lunch! Have you ever noticed it? :)\n",
        "output": "Day #1: the longest nap starts at 15:00 and will last for 30 minutes.\nDay #2: the longest nap starts at 15:00 and will last for 1 hours and 45 minutes.\nDay #3: the longest nap starts at 17:15 and will last for 45 minutes.\nDay #4: the longest nap starts at 13:00 and will last for 5 hours and 0 minutes.\n"
      }
    ]
  },
  {
    "code": "a721",
    "title": "a721. CPE：Permutation Arrays (UVa 482)",
    "samples": [
      {
        "input": "1\n3 1 2\n32.0 54.7 -2\n",
        "output": "54.7\n-2\n32.0\n"
      }
    ]
  },
  {
    "code": "a722",
    "title": "a722. CPE：Degrees of Separation (UVa 1056)",
    "samples": [
      {
        "input": "4 4\nAshok Kiyoshi Ursala Chun Ursala Kiyoshi\nKiyoshi Chun\n4 2\nAshok Chun Ursala Kiyoshi\n6 5\nBubba Cooter Ashok Kiyoshi Ursala Chun\nUrsala Kiyoshi Kiyoshi Chun\n0 0\n",
        "output": "Network 1: 2\n\nNetwork 2: DISCONNECTED\n\nNetwork 3: DISCONNECTED\n\n"
      }
    ]
  },
  {
    "code": "a723",
    "title": "a723. CPE：Ocean Deep! - Make it shallow!! (UVa 10176)",
    "samples": [
      {
        "input": "0#\n1010101#\n",
        "output": "YES\nNO\n"
      }
    ]
  },
  {
    "code": "a724",
    "title": "a724. CPE：Matrix Chain Multiplication (UVa 442)",
    "samples": [
      {
        "input": "9\nA 50 10\nB 10 20\nC 20 5\nD 30 35\nE 35 15\nF 15 5\nG 5 10\nH 10 20\nI 20 25\nA\nB\nC\n(AA)\n(AB)\n(AC)\n(A(BC))\n((AB)C)\n(((((DE)F)G)H)I)\n(D(E(F(G(HI)))))\n((D(EF))((GH)I))\n",
        "output": "0\n0\n0\nerror\n10000\nerror\n3500\n15000\n40500\n47500\n15125\n"
      }
    ]
  },
  {
    "code": "a725",
    "title": "a725. CPE：Prime Land (UVa 516)",
    "samples": [
      {
        "input": "17 1\n5 1 2 1\n509 1 59 1\n0\n",
        "output": "2 4\n3 2\n13 1 11 1 7 1 5 1 3 1 2 1\n"
      }
    ]
  },
  {
    "code": "a726",
    "title": "a726. CPE：Permutations (UVa 941)",
    "samples": [
      {
        "input": "2\nabc\n3\nabcde\n119\n",
        "output": "bca\nedcba\n"
      }
    ]
  },
  {
    "code": "a727",
    "title": "a727. CPE：Rotating Sentences (UVa 490)",
    "samples": [
      {
        "input": "Rene Decartes once said,\n\"I think, therefore I am.\"\n",
        "output": "\"R\nIe\n n\nte\nh\niD\nne\nkc\n,a\n r\ntt\nhe\nes\nr\neo\nfn\noc\nre\ne\n s\nIa\n i\nad\nm,\n.\n\"\n"
      }
    ]
  },
  {
    "code": "a728",
    "title": "a728. CPE：Weights and Measures (UVa 10154)",
    "samples": [
      {
        "input": "300 1000\n1000 1200\n200 600\n100 101\n",
        "output": "3\n"
      }
    ]
  },
  {
    "code": "a729",
    "title": "a729. CPE：Word Index (UVa 417)",
    "samples": [
      {
        "input": "z\na\ncat\nvwxyz\n",
        "output": "26\n1\n0\n83681\n"
      }
    ]
  },
  {
    "code": "a730",
    "title": "a730. CPE：Substitution Cypher (UVa 865)",
    "samples": [
      {
        "input": "1\n\nabcdefghijklmnopqrstuvwxyz\nzyxwvutsrqponmlkjihgfedcba\nShar's Birthday:\nThe birthday is October 6th, but the party will be Saturday,\nOctober 5. It's my 24th birthday and the first one in some\nyears for which I've been employed. Plus, I have new clothes.\nSo I have cause to celebrate. More importantly, though,\nwe've cleaned the house! The address is 506-D Albert Street.\nExtra enticement for CS geeks: there are several systems in\nthe house, and the party is conveniently scheduled for 3 hours\nafter the second CSC programming contest ends (not to mention,\nwithin easy walking distance)!\n",
        "output": "zyxwvutsrqponmlkjihgfedcba\nabcdefghijklmnopqrstuvwxyz\nSszi'h Brigswzb:\nTsv yrigswzb rh Oxglyvi 6gs, yfg gsv kzigb droo yv Szgfiwzb,\nOxglyvi 5. Ig'h nb 24gs yrigswzb zmw gsv urihg lmv rm hlnv\nbvzih uli dsrxs I'ev yvvm vnkolbvw. Pofh, I szev mvd xolgsvh.\nSl I szev xzfhv gl xvovyizgv. Mliv rnkligzmgob, gslfts,\ndv'ev xovzmvw gsv slfhv! Tsv zwwivhh rh 506-D Aoyvig Sgivvg.\nEcgiz vmgrxvnvmg uli CS tvvph: gsviv ziv hvevizo hbhgvnh rm\ngsv slfhv, zmw gsv kzigb rh xlmevmrvmgob hxsvwfovw uli 3 slfih\nzugvi gsv hvxlmw CSC kiltiznnrmt xlmgvhg vmwh (mlg gl nvmgrlm,\ndrgsrm vzhb dzoprmt wrhgzmxv)!\n"
      }
    ]
  },
  {
    "code": "a731",
    "title": "a731. CPE：Points in Figures: Rectangles (UVa 476)",
    "samples": [
      {
        "input": "r 8.5 17.0 25.5 -8.5\nr 0.0 10.3 5.5 0.0\nr 2.5 12.5 12.5 2.5\n*\n2.0 2.0\n4.7 5.3\n6.9 11.2\n20.0 20.0\n17.6 3.2\n-5.2 -7.8\n9999.9 9999.9\n",
        "output": "Point 1 is contained in figure 2\nPoint 2 is contained in figure 2\nPoint 2 is contained in figure 3\nPoint 3 is contained in figure 3\nPoint 4 is not contained in any figure\nPoint 5 is contained in figure 1\nPoint 6 is not contained in any figure\n"
      }
    ]
  },
  {
    "code": "a732",
    "title": "a732. CPE：SuperSale (UVa 10130)",
    "samples": [
      {
        "input": "2\n3\n72 17\n44 23\n31 24\n1\n26\n6\n64 26\n85 22\n52 4\n99 18\n39 13\n54 9\n4\n23\n20\n20\n26\n",
        "output": "72\n514\n"
      }
    ]
  },
  {
    "code": "a733",
    "title": "a733. CPE：Equation Elation (UVa 397)",
    "samples": [
      {
        "input": "3 * 4 + 4 - 1 / 1 = xyzzy\n12 + 2 * 12 / 2 - 1 = y\n2 * -3 + -6 - +4 = r\n2*-3+-6-+4=r\n",
        "output": "3 * 4 + 4 - 1 / 1 = xyzzy\n12 + 4 - 1 / 1 = xyzzy\n12 + 4 - 1 = xyzzy\n16 - 1 = xyzzy\n15 = xyzzy\n\n12 + 2 * 12 / 2 - 1 = y\n12 + 24 / 2 - 1 = y\n12 + 12 - 1 = y\n24 - 1 = y\n23 = y\n\n2 * -3 + -6 - 4 = r\n-6 + -6 - 4 = r\n-12 - 4 = r\n-16 = r\n\n2 * -3 + -6 - 4 = r\n-6 + -6 - 4 = r\n-12 - 4 = r\n-16 = r\n"
      }
    ]
  },
  {
    "code": "a734",
    "title": "a734. CPE：Deciphering Messages (UVa 828)",
    "samples": [
      {
        "input": "1\n\nRSAEIO\n2\n5\nRTSSKAEAGE\nGRSCAV\nRGSSCAV\nRUSIQO\nRUSSGAACEV JEGIITOOGR\n",
        "output": "RICE\nerror in encryption\nEAT\nerror in encryption\nSEAT HERE\n"
      }
    ]
  },
  {
    "code": "a735",
    "title": "a735. CPE：The ? 1 ? 2 ? ... ? n = k problem (UVa 10025)",
    "samples": [
      {
        "input": "2\n\n12\n\n-3646397\n",
        "output": "7\n\n2701\n"
      }
    ]
  },
  {
    "code": "a736",
    "title": "a736. CPE：Call Forwarding (UVa 380)",
    "samples": [
      {
        "input": "2\n1111 0100 0200 2222\n1111 0301 0500 4444\n2222 0200 0200 3333\n3333 0250 1000 1111\n7777 1000 2000 7777\n0000\n0050 1111\n0150 1111\n0200 1111\n0225 2222\n0270 1111\n0320 1111\n0320 3333\n0900 3000\n1250 3333\n1250 7777\n9000\n0000\n3000 1111\n9000\n",
        "output": "CALL FORWARDING OUTPUT\nSYSTEM 1\nAT 0050 CALL TO 1111 RINGS 1111\nAT 0150 CALL TO 1111 RINGS 2222\nAT 0200 CALL TO 1111 RINGS 3333\nAT 0225 CALL TO 2222 RINGS 3333\nAT 0270 CALL TO 1111 RINGS 9999\nAT 0320 CALL TO 1111 RINGS 4444\nAT 0320 CALL TO 3333 RINGS 4444\nAT 0900 CALL TO 3000 RINGS 3000\nAT 1250 CALL TO 3333 RINGS 1111\nAT 1250 CALL TO 7777 RINGS 9999\nSYSTEM 2\nAT 3000 CALL TO 1111 RINGS 1111\nEND OF OUTPUT\n"
      }
    ]
  },
  {
    "code": "a737",
    "title": "a737. CPE：Product (UVa 10106)",
    "samples": [
      {
        "input": "12\n12\n2\n222222222222222222222222\n",
        "output": "144\n444444444444444444444444\n"
      }
    ]
  },
  {
    "code": "a738",
    "title": "a738. CPE：Tile Puzzle (UVa 798)",
    "samples": [
      {
        "input": "3 2 2\n2 1 1\n2 1 2\n\n5 2 2\n2 1 1\n4 1 2\n",
        "output": "11\n56\n"
      }
    ]
  },
  {
    "code": "a739",
    "title": "a739. CPE：The book thief (UVa 12908)",
    "samples": [
      {
        "input": "1\n2\n3\n4\n5\n6\n9000\n499977\n49999775\n0\n",
        "output": "2 2\n1 2\n3 3\n2 3\n1 3\n4 4\n45 134\n523 1000\n5225 10000\n"
      }
    ]
  },
  {
    "code": "a740",
    "title": "a740. CPE：An Easy Problem! (UVa 10093)",
    "samples": [
      {
        "input": "3\n5\nA\n",
        "output": "4\n6\n11\n"
      }
    ]
  },
  {
    "code": "a741",
    "title": "a741. CPE：Symmetric Matrix (UVa 11349)",
    "samples": [
      {
        "input": "2\nN = 3\n5 1 3\n2 0 2\n3 1 5\nN = 3\n5 1 3\n2 0 2\n0 1 5\n",
        "output": "Test #1: Symmetric.\nTest #2: Non-symmetric.\n"
      }
    ]
  },
  {
    "code": "a742",
    "title": "a742. CPE：Pizza Cutting (UVa 10079)",
    "samples": [
      {
        "input": "5\n10\n-100\n",
        "output": "16\n56\n"
      }
    ]
  },
  {
    "code": "a743",
    "title": "a743. CPE：Division (UVa 725)",
    "samples": [
      {
        "input": "61\n62\n0\n",
        "output": "There are no solutions for 61.\n\n79546 / 01283 = 62\n94736 / 01528 = 62\n"
      }
    ]
  },
  {
    "code": "a744",
    "title": "a744. CPE：Formatting Text (UVa 709)",
    "samples": [
      {
        "input": "28\nThis is the example you are\nactually considering.\n\n25\nWriting e-mails is fun, and with this program,\nthey even look nice.\n\n0\n",
        "output": "This  is  the  example   you\nare  actually   considering.\n\nWriting e-mails  is  fun,\nand  with  this  program,\nthey  even   look   nice.\n\n"
      }
    ]
  },
  {
    "code": "a745",
    "title": "a745. CPE：Dropping Balls (UVa 679)",
    "samples": [
      {
        "input": "5\n4 2\n3 4\n10 1\n2 2\n8 128\n-1\n",
        "output": "12\n7\n512\n3\n255\n"
      }
    ]
  },
  {
    "code": "a746",
    "title": "a746. CPE：Tell me the frequencies! (UVa 10062)",
    "samples": [
      {
        "input": "AAABBC\n122333\n",
        "output": "67 1\n66 2\n65 3\n\n49 1\n50 2\n51 3\n"
      }
    ]
  },
  {
    "code": "a747",
    "title": "a747. CPE：Anagrams (II) (UVa 630)",
    "samples": [
      {
        "input": "1\n8\natol\nlato\nmicrophotographics\nrata\nrola\ntara\ntola\npies\ntola\nkola\naatr\nphotomicrographics\nEND\n",
        "output": "Anagrams for: tola\n  1) atol\n  2) lato\n  3) tola\nAnagrams for: kola\nNo anagrams for: kola\nAnagrams for: aatr\n  1) rata\n  2) tara\nAnagrams for: photomicrographics\n  1) microphotographics\n"
      }
    ]
  },
  {
    "code": "a748",
    "title": "a748. CPE：Master-Mind Hints (UVa 340)",
    "samples": [
      {
        "input": "4\n1 3 5 5\n1 1 2 3\n4 3 3 5\n6 5 5 1\n6 1 3 5\n1 3 5 5\n0 0 0 0\n10\n1 2 2 2 4 5 6 6 6 9\n1 2 3 4 5 6 7 8 9 1\n1 1 2 2 3 3 4 4 5 5\n1 2 1 3 1 5 1 6 1 9\n1 2 2 5 5 5 6 6 6 7\n0 0 0 0 0 0 0 0 0 0\n0\n",
        "output": "Game 1:\n    (1,1)\n    (2,0)\n    (1,2)\n    (1,2)\n    (4,0)\nGame 2:\n    (2,4)\n    (3,2)\n    (5,0)\n    (7,0)\n"
      }
    ]
  },
  {
    "code": "a749",
    "title": "a749. CPE：Vito’s family (UVa 10041)",
    "samples": [
      {
        "input": "2\n2 2 4\n3 2 4 6\n",
        "output": "2\n4\n"
      }
    ]
  },
  {
    "code": "a750",
    "title": "a750. CPE：Critical Mass (UVa 580)",
    "samples": [
      {
        "input": "4\n5\n0\n",
        "output": "3\n8\n"
      }
    ]
  },
  {
    "code": "a751",
    "title": "a751. CPE：Tug of War (UVa 10032)",
    "samples": [
      {
        "input": "1\n3\n100\n90\n200\n",
        "output": "190 200\n"
      }
    ]
  },
  {
    "code": "a752",
    "title": "a752. CPE：Open Credit System (UVa 11078)",
    "samples": [
      {
        "input": "3\n2\n100\n20\n4\n4\n3\n2\n1\n4\n1\n2\n3\n4\n",
        "output": "80\n3\n-1\n"
      }
    ]
  },
  {
    "code": "a753",
    "title": "a753. CPE：Funny Encryption Method (UVa 10019)",
    "samples": [
      {
        "input": "3\n265\n111\n1234\n",
        "output": "3 5\n6 3\n5 5\n"
      }
    ]
  },
  {
    "code": "a754",
    "title": "a754. CPE：Heavy Cargo (UVa 544)",
    "samples": [
      {
        "input": "4 3\nKarlsruhe Stuttgart 100\nStuttgart Ulm 80\nUlm Muenchen 120\nKarlsruhe Muenchen\n5 5\nKarlsruhe Stuttgart 100\nStuttgart Ulm 80\nUlm Muenchen 120\nKarlsruhe Hamburg 220\nHamburg Muenchen 170\nMuenchen Karlsruhe\n0 0\n",
        "output": "Scenario #1\n80 tons\n\nScenario #2\n170 tons\n\n"
      }
    ]
  },
  {
    "code": "a755",
    "title": "a755. CPE：What’s Cryptanalysis? (UVa 10008)",
    "samples": [
      {
        "input": "3\nThis is a test.\nCount me 1 2 3 4 5.\nWow!!!! Is this question easy?\n",
        "output": "S 7\nT 6\nI 5\nE 4\nO 3\nA 2\nH 2\nN 2\nU 2\nW 2\nC 1\nM 1\nQ 1\nY 1\n"
      }
    ]
  },
  {
    "code": "a756",
    "title": "a756. CPE：Tree Recovery (UVa 536)",
    "samples": [
      {
        "input": "DBACEGF ABCDEFG\nBCAD CBAD\n",
        "output": "ACBFGED\nCDAB\n"
      }
    ]
  },
  {
    "code": "a757",
    "title": "a757. CPE：Rails (UVa 514)",
    "samples": [
      {
        "input": "5\n1 2 3 4 5\n5 4 1 2 3\n0\n6\n6 5 4 3 2 1\n0\n0\n",
        "output": "Yes\nNo\n\nYes\n\n"
      }
    ]
  },
  {
    "code": "a758",
    "title": "a758. CPE：Knight Moves (UVa 439)",
    "samples": [
      {
        "input": "e2 e4\na1 b2\nb2 c3\na1 h8\na1 h7\nh8 a1\nb1 c3\nf6 f6\n",
        "output": "To get from e2 to e4 takes 2 knight moves.\nTo get from a1 to b2 takes 4 knight moves.\nTo get from b2 to c3 takes 2 knight moves.\nTo get from a1 to h8 takes 6 knight moves.\nTo get from a1 to h7 takes 5 knight moves.\nTo get from h8 to a1 takes 6 knight moves.\nTo get from b1 to c3 takes 1 knight moves.\nTo get from f6 to f6 takes 0 knight moves.\n"
      }
    ]
  },
  {
    "code": "a759",
    "title": "a759. CPE：Keyboarding (UVa 1714)",
    "samples": [
      {
        "input": "4 7\nABCDEFG\nHIJKLMN\nOPQRSTU\nVWXYZ**\nCONTEST\n5 20\n12233445566778899000\nQQWWEERRTTYYUUIIOOPP\n-AASSDDFFGGHHJJKKLL*\n--ZZXXCCVVBBNNMM--**\n--------------------\nACM-ICPC-WORLD-FINALS-2015\n2 19\nABCDEFGHIJKLMNOPQZY\nX*****************Y\nAZAZ\n6 4\nAXYB\nBBBB\nKLMB\nOPQB\nDEFB\nGHI*\nAB\n",
        "output": "30\n160\n19\n7\n"
      }
    ]
  },
  {
    "code": "a760",
    "title": "a760. CPE：Network (UVa 315)",
    "samples": [
      {
        "input": "5\n5 1 2 3 4\n0\n6\n2 1 3\n5 4 6 2\n0\n0\n",
        "output": "1\n2\n"
      }
    ]
  },
  {
    "code": "a761",
    "title": "a761. CPE：Prime Gap (UVa 1644)",
    "samples": [
      {
        "input": "10\n11\n27\n2\n492170\n0\n",
        "output": "4\n0\n6\n0\n114\n"
      }
    ]
  },
  {
    "code": "a762",
    "title": "a762. CPE：Find the Telephone (UVa 10921)",
    "samples": [
      {
        "input": "1-HOME-SWEET-HOME\nMY-MISERABLE-JOB\n",
        "output": "1-4663-79338-4663\n69-647372253-562\n"
      }
    ]
  },
  {
    "code": "a763",
    "title": "a763. CPE：Simple division (UVa 10407)",
    "samples": [
      {
        "input": "701 1059 1417 2312 0\n14 23 17 32 122 0\n14 -22 17 -31 -124 0\n0\n",
        "output": "179\n3\n3\n"
      }
    ]
  },
  {
    "code": "a764",
    "title": "a764. CPE：Box (UVa 1587)",
    "samples": [
      {
        "input": "1345 2584\n2584 683\n2584 1345\n683 1345\n683 1345\n2584 683\n1234 4567\n1234 4567\n4567 4321\n4322 4567\n4321 1234\n4321 1234\n",
        "output": "POSSIBLE\nIMPOSSIBLE\n"
      }
    ]
  },
  {
    "code": "a765",
    "title": "a765. CPE：Simply Emirp (UVa 10235)",
    "samples": [
      {
        "input": "17\n18\n19\n179\n199\n",
        "output": "17 is emirp.\n18 is not prime.\n19 is prime.\n179 is emirp.\n199 is emirp.\n"
      }
    ]
  },
  {
    "code": "a766",
    "title": "a766. CPE：Period (UVa 1371)",
    "samples": [
      {
        "input": "3\nabc\nabcdabcabb\nabab\nabababababab\nxyz\nabcdefghikjlmn\n",
        "output": "1\n0\n3\n"
      }
    ]
  },
  {
    "code": "a767",
    "title": "a767. CPE：Divisors (UVa 294)",
    "samples": [
      {
        "input": "3\n1 10\n1000 1000\n999999900 1000000000\n",
        "output": "Between 1 and 10, 6 has a maximum of 4 divisors.\nBetween 1000 and 1000, 1000 has a maximum of 16 divisors.\nBetween 999999900 and 1000000000, 999999924 has a maximum of 192 divisors.\n"
      }
    ]
  },
  {
    "code": "a768",
    "title": "a768. CPE：Last Digit (UVa 10162)",
    "samples": [
      {
        "input": "1\n2\n3\n0\n",
        "output": "1\n5\n2\n"
      }
    ]
  },
  {
    "code": "a769",
    "title": "a769. CPE：Supermarket (UVa 1316)",
    "samples": [
      {
        "input": "4 50 2 10 1 20 2 30 1\n\n7 20 1 2 1 10 3 100 2 8 2 5 20 50 10\n",
        "output": "80\n185\n"
      }
    ]
  },
  {
    "code": "a770",
    "title": "a770. CPE：Number Chains (UVa 263)",
    "samples": [
      {
        "input": "123456789\n1234\n444\n0\n",
        "output": "Original number was 123456789\n987654321 - 123456789 = 864197532\n987654321 - 123456789 = 864197532\nChain length 2\n\nOriginal number was 1234\n4321 - 1234 = 3087\n8730 - 378 = 8352\n8532 - 2358 = 6174\n7641 - 1467 = 6174\nChain length 4\n\nOriginal number was 444\n444 - 444 = 0\n0 - 0 = 0\nChain length 2\n\n"
      }
    ]
  },
  {
    "code": "a771",
    "title": "a771. CPE：Stamps and Envelope Size (UVa 242)",
    "samples": [
      {
        "input": "5\n2\n4 1 4 12 21\n4 1 5 12 28\n10\n2\n5 1 7 16 31 88\n5 1 15 52 67 99\n6\n2\n3 1 5 8\n4 1 5 7 8\n0\n",
        "output": "max coverage =  71 :  1  4 12 21\nmax coverage = 409 :  1  7 16 31 88\nmax coverage =  48 :  1  5  7  8\n"
      }
    ]
  },
  {
    "code": "a772",
    "title": "a772. CPE：Fibonaccimal Base (UVa 948)",
    "samples": [
      {
        "input": "10\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n",
        "output": "1 = 1 (fib)\n2 = 10 (fib)\n3 = 100 (fib)\n4 = 101 (fib)\n5 = 1000 (fib)\n6 = 1001 (fib)\n7 = 1010 (fib)\n8 = 10000 (fib)\n9 = 10001 (fib)\n10 = 10010 (fib)\n"
      }
    ]
  },
  {
    "code": "a773",
    "title": "a773. CPE：Expert Enough? (UVa 1237)",
    "samples": [
      {
        "input": "1\n4\nHONDA 10000 45000\nPEUGEOT 12000 44000\nBMW 30000 75900\nCHEVROLET 7000 37000\n4\n60000\n7500\n5000\n10000\n",
        "output": "BMW\nCHEVROLET\nUNDETERMINED\nUNDETERMINED\n"
      }
    ]
  },
  {
    "code": "a774",
    "title": "a774. CPE：Factors and Factorials (UVa 160)",
    "samples": [
      {
        "input": "5\n53\n0\n",
        "output": "  5! =  3  1  1\n 53! = 49 23 12  8  4  4  3  2  2  1  1  1  1  1  1\n        1\n"
      }
    ]
  },
  {
    "code": "a775",
    "title": "a775. CPE：Continued Fractions (UVa 834)",
    "samples": [
      {
        "input": "43 19\n1 2\n",
        "output": "[2;3,1,4]\n[0;2]\n"
      }
    ]
  },
  {
    "code": "a776",
    "title": "a776. CPE：Oreon (UVa 1208)",
    "samples": [
      {
        "input": "1\n6\n0, 8, 12, 0, 0, 7\n8, 0, 0, 3, 0, 0\n12, 0, 0, 0, 6, 0\n0, 3, 0, 0, 0, 4\n0, 0, 6, 0, 0, 5\n7, 0, 0, 4, 5, 0\n",
        "output": "Case 1:\nB-D 3\nD-F 4\nE-F 5\nC-E 6\nA-F 7\n"
      }
    ]
  },
  {
    "code": "a777",
    "title": "a777. CPE：Goldbach’s Conjecture (II) (UVa 686)",
    "samples": [
      {
        "input": "6\n10\n12\n0\n",
        "output": "1\n2\n1\n"
      }
    ]
  },
  {
    "code": "a778",
    "title": "a778. CPE：The Spot Game (UVa 141)",
    "samples": [
      {
        "input": "2\n1 1 +\n2 2 +\n2 2 -\n1 2 +\n2\n1 1 +\n2 2 +\n1 2 +\n2 2 -\n0\n",
        "output": "Player 2 wins on move 3\nDraw\n"
      }
    ]
  },
  {
    "code": "a779",
    "title": "a779. CPE：Radar Installation (UVa 1193)",
    "samples": [
      {
        "input": "3 2\n1 2\n-3 1\n2 1\n\n1 2\n0 2\n\n0 0\n",
        "output": "Case 1: 2\nCase 2: 1\n"
      }
    ]
  },
  {
    "code": "a780",
    "title": "a780. CPE：Box of Bricks (UVa 591)",
    "samples": [
      {
        "input": "6\n5 2 4 1 7 5\n0\n",
        "output": "Set #1\nThe minimum number of moves is 5.\n\n"
      }
    ]
  },
  {
    "code": "a781",
    "title": "a781. CPE：Product of digits (UVa 993)",
    "samples": [
      {
        "input": "3\n1\n10\n123456789\n",
        "output": "1\n25\n-1\n"
      }
    ]
  },
  {
    "code": "a782",
    "title": "a782. CPE：Lotto (UVa 441)",
    "samples": [
      {
        "input": "7 1 2 3 4 5 6 7\n8 1 2 3 5 8 13 21 34\n0\n",
        "output": "1 2 3 4 5 6\n1 2 3 4 5 7\n1 2 3 4 6 7\n1 2 3 5 6 7\n1 2 4 5 6 7\n1 3 4 5 6 7\n2 3 4 5 6 7\n\n1 2 3 5 8 13\n1 2 3 5 8 21\n1 2 3 5 8 34\n1 2 3 5 13 21\n1 2 3 5 13 34\n1 2 3 5 21 34\n1 2 3 8 13 21\n1 2 3 8 13 34\n1 2 3 8 21 34\n1 2 3 13 21 34\n1 2 5 8 13 21\n1 2 5 8 13 34\n1 2 5 8 21 34\n1 2 5 13 21 34\n1 2 8 13 21 34\n1 3 5 8 13 21\n1 3 5 8 13 34\n1 3 5 8 21 34\n1 3 5 13 21 34\n1 3 8 13 21 34\n1 5 8 13 21 34\n2 3 5 8 13 21\n2 3 5 8 13 34\n2 3 5 8 21 34\n2 3 5 13 21 34\n2 3 8 13 21 34\n2 5 8 13 21 34\n3 5 8 13 21 34\n"
      }
    ]
  },
  {
    "code": "a783",
    "title": "a783. CPE：Number Maze (UVa 929)",
    "samples": [
      {
        "input": "2\n4\n5\n0 3 1 2 9\n7 3 4 9 9\n1 7 5 5 3\n2 3 4 2 5\n1\n6\n0 1 2 3 4 5\n",
        "output": "24\n15\n"
      }
    ]
  },
  {
    "code": "a784",
    "title": "a784. CPE：Maximum Sum (UVa 108)",
    "samples": [
      {
        "input": "4\n0 -2 -7 0 9 2 -6 2\n-4 1 -4 1 -1\n8 0 -2\n",
        "output": "15\n"
      }
    ]
  },
  {
    "code": "a785",
    "title": "a785. CPE：Polynomial Showdown (UVa 392)",
    "samples": [
      {
        "input": "0 0 0 1 22 -333 0 1 -1\n0 0 0 0 0 0 -55 5 0\n",
        "output": "x^5 + 22x^4 - 333x^3 + x - 1\n-55x^2 + 5x\n"
      }
    ]
  },
  {
    "code": "a786",
    "title": "a786. CPE：Count on Cantor (UVa 264)",
    "samples": [
      {
        "input": "3\n14\n7\n",
        "output": "TERM 3 IS 2/1\nTERM 14 IS 2/4\nTERM 7 IS 1/4\n"
      }
    ]
  },
  {
    "code": "a787",
    "title": "a787. CPE：Lunch in Grid City (UVa 855)",
    "samples": [
      {
        "input": "2\n2 2 2\n1 1\n2 2\n7 7 11\n1 2\n1 7\n2 2\n2 3\n2 5\n3 4\n4 2\n4 5\n4 6\n5 3\n6 5\n",
        "output": "(Street: 1, Avenue: 1)\n(Street: 3, Avenue: 4)\n"
      }
    ]
  },
  {
    "code": "a788",
    "title": "a788. CPE：Page Hopping (UVa 821)",
    "samples": [
      {
        "input": "1 2 2 4 1 3 3 1 4 3 0 0\n1 2 1 4 4 2 2 7 7 1 0 0\n0 0\n",
        "output": "Case 1: average length between pages = 1.833 clicks\nCase 2: average length between pages = 1.750 clicks\n"
      }
    ]
  },
  {
    "code": "a789",
    "title": "a789. CPE：A Plug for UNIX (UVa 753)",
    "samples": [
      {
        "input": "1\n\n4\nA\nB\nC\nD\n5\nlaptop B\nphone C\npager B\nclock B\ncomb X\n3\nB X\nX A\nX D\n",
        "output": "1\n"
      }
    ]
  },
  {
    "code": "a790",
    "title": "a790. CPE：Lakes (UVa 722)",
    "samples": [
      {
        "input": "1\n\n02 01\n1001101\n0011111\n0001001\n1100011\n1111111\n1100110\n1110111\n",
        "output": "12\n"
      }
    ]
  },
  {
    "code": "a791",
    "title": "a791. CPE：LC-Display (UVa 706)",
    "samples": [
      {
        "input": "2 12345\n3 67890\n0 0\n",
        "output": "      --   --        -- \n   |    |    | |  | |   \n   |    |    | |  | |   \n      --   --   --   -- \n   | |       |    |    |\n   | |       |    |    |\n      --   --        -- \n\n ---   ---   ---   ---   --- \n|         | |   | |   | |   |\n|         | |   | |   | |   |\n|         | |   | |   | |   |\n ---         ---   ---       \n|   |     | |   |     | |   |\n|   |     | |   |     | |   |\n|   |     | |   |     | |   |\n ---         ---   ---   --- \n\n"
      }
    ]
  },
  {
    "code": "a792",
    "title": "a792. CPE：Maya Calendar (UVa 300)",
    "samples": [
      {
        "input": "3\n10. zac 0\n0. pop 0\n10. zac 1995\n",
        "output": "3\n3 chuen 0\n1 imix 0\n9 cimi 2801\n"
      }
    ]
  },
  {
    "code": "a793",
    "title": "a793. CPE：Correct Move (UVa 255)",
    "samples": [
      {
        "input": "17 17 49\n17 49 56\n17 49 9\n17 49 17\n17 49 25\n17 49 33\n17 49 41\n17 49 49\n56 48 49\n",
        "output": "Illegal state\nIllegal move\nIllegal move\nIllegal move\nMove not allowed\nContinue\nContinue\nIllegal move\nStop\n"
      }
    ]
  },
  {
    "code": "a794",
    "title": "a794. CPE：Making Change (UVa 166)",
    "samples": [
      {
        "input": "2 4 2 2 1 0 0.95\n2 4 2 0 1 0 0.55\n0 0 0 0 0 0\n",
        "output": "  2\n  3\n"
      }
    ]
  },
  {
    "code": "a795",
    "title": "a795. CPE：Coin Change (UVa 674)",
    "samples": [
      {
        "input": "11\n26\n",
        "output": "4\n13\n"
      }
    ]
  },
  {
    "code": "a796",
    "title": "a796. CPE：Dollars (UVa 147)",
    "samples": [
      {
        "input": "0.20\n2.00\n0.00\n",
        "output": "  0.20                4\n  2.00              293\n"
      }
    ]
  },
  {
    "code": "a797",
    "title": "a797. CPE：Mutant Flatworld Explorers (UVa 118)",
    "samples": [
      {
        "input": "5 3\n1 1 E\nRFRFRFRF\n3 2 N\nFRRFLLFFRRFLL\n0 3 W\nLLFFFLFLFL\n",
        "output": "1 1 E\n3 3 N LOST\n2 3 S\n"
      }
    ]
  },
  {
    "code": "a798",
    "title": "a798. CPE：Is It A Tree? (UVa 615)",
    "samples": [
      {
        "input": "6 8 5 3 5 2 6 4\n5 6 0 0\n8 1 7 3 6 2 8 9 7 5\n7 4 7 8 7 6 0 0\n3 8 6 8 6 4\n5 3 5 6 5 2 0 0\n-1 -1\n",
        "output": "Case 1 is a tree.\nCase 2 is a tree.\nCase 3 is not a tree.\n"
      }
    ]
  },
  {
    "code": "a799",
    "title": "a799. CPE：The 3n + 1 problem (UVa 100)",
    "samples": [
      {
        "input": "1 10\n100 200\n201 210\n900 1000\n",
        "output": "1 10 20\n100 200 125\n201 210 89\n900 1000 174\n"
      }
    ]
  },
  {
    "code": "a800",
    "title": "a800. CPE：ClockHands (UVa 579)",
    "samples": [
      {
        "input": "12:00\n9:00\n8:10\n0:00\n",
        "output": "0.000\n90.000\n175.000\n"
      }
    ]
  },
  {
    "code": "a801",
    "title": "a801. CPE：Goldbach’s Conjecture (UVa 543)",
    "samples": [
      {
        "input": "8\n20\n42\n0\n",
        "output": "8 = 3 + 5\n20 = 3 + 17\n42 = 5 + 37\n"
      }
    ]
  },
  {
    "code": "a802",
    "title": "a802. CPE：Frogger (UVa 534)",
    "samples": [
      {
        "input": "2\n0 0\n3 4\n\n3\n17 4\n19 4\n18 5\n\n0\n",
        "output": "Scenario #1\nFrog Distance = 5.000\n\nScenario #2\nFrog Distance = 1.414\n\n"
      }
    ]
  },
  {
    "code": "a803",
    "title": "a803. CPE：DPA Numbers I (UVa 13185)",
    "samples": [
      {
        "input": "10\n5\n6\n16\n18\n21\n28\n29\n30\n40\n43\n",
        "output": "deficient\nperfect\ndeficient\nabundant\ndeficient\nperfect\ndeficient\nabundant\nabundant\ndeficient\n"
      }
    ]
  },
  {
    "code": "a804",
    "title": "a804. CPE：Strategy Game (UVa 12959)",
    "samples": [
      {
        "input": "3 3\n1 1 1 1 2 2 2 3 3\n2 3\n0 0 1 0 2 0\n",
        "output": "3\n1\n"
      }
    ]
  },
  {
    "code": "a805",
    "title": "a805. CPE：Spreadsheet Tracking (UVa 512)",
    "samples": [
      {
        "input": "7 9\n5\nDR 2 1 5\nDC 4 3 6 7 9\nIC 1 3\nIR 2 2 4\nEX 1 2 6 5\n4\n4 8\n5 5\n7 8\n6 5\n0 0\n",
        "output": "Spreadsheet #1\nCell data in (4,8) moved to (4,6)\nCell data in (5,5) GONE\nCell data in (7,8) moved to (7,6)\nCell data in (6,5) moved to (1,2)\n"
      }
    ]
  },
  {
    "code": "a806",
    "title": "a806. CPE：Fibonacci Freeze (UVa 495)",
    "samples": [
      {
        "input": "5\n7\n11\n",
        "output": "The Fibonacci number for 5 is 5\nThe Fibonacci number for 7 is 13\nThe Fibonacci number for 11 is 89\n"
      }
    ]
  },
  {
    "code": "a807",
    "title": "a807. CPE：Word Scramble (UVa 483)",
    "samples": [
      {
        "input": "I love you.\nYou love me.\nWe're a happy family.\n",
        "output": "I evol .uoy\nuoY evol .em\ner'eW a yppah .ylimaf\n"
      }
    ]
  },
  {
    "code": "a808",
    "title": "a808. CPE：Periodic Strings (UVa 455)",
    "samples": [
      {
        "input": "1\n\nHoHoHo\n",
        "output": "2\n"
      }
    ]
  },
  {
    "code": "a809",
    "title": "a809. CPE：The Tower of Babylon (UVa 437)",
    "samples": [
      {
        "input": "1\n10 20 30\n2\n6 8 10\n5 5 5\n7\n1 1 1\n2 2 2\n3 3 3\n4 4 4\n5 5 5\n6 6 6\n7 7 7\n5\n31 41 59\n26 53 58\n97 93 23\n84 62 64\n33 83 27\n0\n",
        "output": "Case 1: maximum height = 40\nCase 2: maximum height = 21\nCase 3: maximum height = 28\nCase 4: maximum height = 342\n"
      }
    ]
  },
  {
    "code": "a810",
    "title": "a810. CPE：Nice Licence Plates (UVa 12602)",
    "samples": [
      {
        "input": "2\nABC-0123\nAAA-9999\n",
        "output": "nice\nnot nice\n"
      }
    ]
  },
  {
    "code": "a811",
    "title": "a811. CPE：Robot Instructions (UVa 12503)",
    "samples": [
      {
        "input": "2\n3\nLEFT\nRIGHT\nSAME AS 2\n5\nLEFT\nSAME AS 1\nSAME AS 2\nSAME AS 1\nSAME AS 4\n",
        "output": "1\n-5\n"
      }
    ]
  },
  {
    "code": "a812",
    "title": "a812. CPE：Palindromes (UVa 401)",
    "samples": [
      {
        "input": "NOTAPALINDROME\nISAPALINILAPASI\n2A3MEAS\nATOYOTA\n",
        "output": "NOTAPALINDROME -- is not a palindrome.\n\nISAPALINILAPASI -- is a regular palindrome.\n\n2A3MEAS -- is a mirrored string.\n\nATOYOTA -- is a mirrored palindrome.\n\n"
      }
    ]
  },
  {
    "code": "a813",
    "title": "a813. CPE：Magic Formula (UVa 11934)",
    "samples": [
      {
        "input": "0 0 10 5 100\n0 0 10 6 100\n1 2 3 4 5\n1 2 3 3 5\n0 0 0 0 0\n",
        "output": "101\n0\n0\n4\n"
      }
    ]
  },
  {
    "code": "a814",
    "title": "a814. CPE：Credit Check (UVa 11743)",
    "samples": [
      {
        "input": "2\n5181 2710 9900 0012\n5181 2710 9900 0017\n",
        "output": "Invalid\nValid\n"
      }
    ]
  },
  {
    "code": "a815",
    "title": "a815. CPE：John’s trip (UVa 302)",
    "samples": [
      {
        "input": "1 2 1\n2 3 2\n3 1 6\n1 2 5\n2 3 3\n3 1 4\n0 0\n1 2 1\n2 3 2\n1 3 3\n2 4 4\n0 0\n0 0\n",
        "output": "1 2 3 5 4 6\n\nRound trip does not exist.\n\n"
      }
    ]
  },
  {
    "code": "a816",
    "title": "a816. CPE：Soda Surpler (UVa 11689)",
    "samples": [
      {
        "input": "2\n9 0 3\n5 5 2\n",
        "output": "4\n9\n"
      }
    ]
  },
  {
    "code": "a817",
    "title": "a817. CPE：Arithmetic Operations With Large Integers (UVa 288)",
    "samples": [
      {
        "input": "12345678*129876+2**1993\n",
        "output": "896977105683011347056900938420064050017435704756793125373158388145129891712789307700515223684770523373785909874208955291755561688174261977676508872005197801086953040197752187505381087095625350558038492109870986287356370809737409093338414265941143390397695285610643740694879918793932122262001282984143224073001319601441082075018589725061828585163552941409601583724270514300953188533095947591884905338415676554651534516617357655143781579373852994152663198702360093129335607684294312805938140290754926427776409574872859496315224893901812925850900592061583009183090068756428459147015355107518672556877720\n"
      }
    ]
  },
  {
    "code": "a818",
    "title": "a818. CPE：Hello World! (UVa 11636)",
    "samples": [
      {
        "input": "2\n10\n-1\n",
        "output": "Case 1: 1\nCase 2: 4\n"
      }
    ]
  },
  {
    "code": "a819",
    "title": "a819. CPE：Group Reverse (UVa 11192)",
    "samples": [
      {
        "input": "3 ABCEHSHSH\n5 FA0ETASINAHGRI0NATWON0QA0NARI0\n0\n",
        "output": "CBASHEHSH\nATE0AFGHANISTAN0IRAQ0NOW0IRAN0\n"
      }
    ]
  },
  {
    "code": "a820",
    "title": "a820. CPE：Base -2 (UVa 11121)",
    "samples": [
      {
        "input": "4\n1\n7\n-2\n0\n",
        "output": "Case #1: 1\nCase #2: 11011\nCase #3: 10\nCase #4: 0\n"
      }
    ]
  },
  {
    "code": "a821",
    "title": "a821. CPE：Variable Radix Huffman Encoding (UVa 240)",
    "samples": [
      {
        "input": "2 5 5 10 20 25 40\n2 5 4 2 2 1 1\n3 7 20 5 8 5 12 6 9\n4 6 10 23 18 25 9 12\n0\n",
        "output": "Set 1; average length 2.10\n    A: 1100\n    B: 1101\n    C: 111\n    D: 10\n    E: 0\n\nSet 2; average length 2.20\n    A: 11\n    B: 00\n    C: 01\n    D: 100\n    E: 101\n\nSet 3; average length 1.69\n    A: 1\n    B: 00\n    C: 20\n    D: 01\n    E: 22\n    F: 02\n    G: 21\n\nSet 4; average length 1.32\n    A: 32\n    B: 1\n    C: 0\n    D: 2\n    E: 31\n    F: 33\n\n"
      }
    ]
  },
  {
    "code": "a822",
    "title": "a822. CPE：Bee (UVa 11000)",
    "samples": [
      {
        "input": "1\n3\n-1\n",
        "output": "1 2\n4 7\n"
      }
    ]
  },
  {
    "code": "a823",
    "title": "a823. CPE：Parity (UVa 10931)",
    "samples": [
      {
        "input": "1\n2\n10\n21\n0\n",
        "output": "The parity of 1 is 1 (mod 2).\nThe parity of 10 is 1 (mod 2).\nThe parity of 1010 is 2 (mod 2).\nThe parity of 10101 is 3 (mod 2).\n"
      }
    ]
  },
  {
    "code": "a824",
    "title": "a824. CPE：Andy’s First Dictionary (UVa 10815)",
    "samples": [
      {
        "input": "Adventures in Disneyland\nTwo blondes were going to Disneyland when they came to a fork in the\nroad. The sign read: \"Disneyland Left.\"\nSo they went home.\n",
        "output": "a\nadventures\nblondes\ncame\ndisneyland\nfork\ngoing\nhome\nin\nleft\nread\nroad\nsign\nso\nthe\nthey\nto\ntwo\nwent\nwere\nwhen\n"
      }
    ]
  },
  {
    "code": "a825",
    "title": "a825. CPE：Power Crisis (UVa 151)",
    "samples": [
      {
        "input": "17\n0\n",
        "output": "7\n"
      }
    ]
  },
  {
    "code": "a826",
    "title": "a826. CPE：Prime Frequency (UVa 10789)",
    "samples": [
      {
        "input": "3\nABCC\nAABBBBDDDDD\nABCDFFFF\n",
        "output": "Case 1: C\nCase 2: AD\nCase 3: empty\n"
      }
    ]
  },
  {
    "code": "a827",
    "title": "a827. CPE：Rare Easy Problem (UVa 10633)",
    "samples": [
      {
        "input": "18\n0\n",
        "output": "19 20\n"
      }
    ]
  },
  {
    "code": "a828",
    "title": "a828. CPE：Trees on the level (UVa 122)",
    "samples": [
      {
        "input": "(11,LL) (7,LLL) (8,R)\n(5,) (4,L) (13,RL) (2,LLR) (1,RRR) (4,RR) ()\n(3,L) (4,R) ()\n",
        "output": "5 4 8 11 13 4 7 2 1\nnot complete\n"
      }
    ]
  },
  {
    "code": "a829",
    "title": "a829. CPE：Where is the Marble? (UVa 10474)",
    "samples": [
      {
        "input": "4 1\n2\n3\n5\n1\n5\n5 2\n1\n3\n3\n3\n1\n2\n3\n0 0\n",
        "output": "CASE# 1:\n5 found at 4\nCASE# 2:\n2 not found\n3 found at 3\n"
      }
    ]
  },
  {
    "code": "a830",
    "title": "a830. CPE：List of Conquests (UVa 10420)",
    "samples": [
      {
        "input": "3\nSpain Donna Elvira\nEngland Jane Doe\nSpain Donna Anna\n",
        "output": "England 1\nSpain 2\n"
      }
    ]
  },
  {
    "code": "a831",
    "title": "a831. CPE：Flip Sort (UVa 10327)",
    "samples": [
      {
        "input": "3\n1 2 3\n3\n2 3 1\n",
        "output": "Minimum exchange operations : 0\nMinimum exchange operations : 2\n"
      }
    ]
  },
  {
    "code": "a832",
    "title": "a832. CPE：All You Need Is Love (UVa 10193)",
    "samples": [
      {
        "input": "5\n11011\n11000\n11011\n11001\n111111\n100\n1000000000\n110\n1010\n100\n",
        "output": "Pair #1: All you need is love!\nPair #2: Love is not all you need!\nPair #3: Love is not all you need!\nPair #4: All you need is love!\nPair #5: All you need is love!\n"
      }
    ]
  },
  {
    "code": "a833",
    "title": "a833. CPE：What is the Median? (UVa 10107)",
    "samples": [
      {
        "input": "1\n3\n4\n60\n70\n50\n2\n",
        "output": "1\n2\n3\n3\n4\n27\n4\n"
      }
    ]
  },
  {
    "code": "a834",
    "title": "a834. CPE：Primary Arithmetic (UVa 10035)",
    "samples": [
      {
        "input": "123 456\n555 555\n123 594\n0 0\n",
        "output": "No carry operation.\n3 carry operations.\n1 carry operation.\n"
      }
    ]
  },
  {
    "code": "a835",
    "title": "a835. CPE：Sales (UVa 1260)",
    "samples": [
      {
        "input": "2\n5\n38 111 102 111 177\n8\n276 284 103 439 452 276 452 398\n",
        "output": "9\n20\n"
      }
    ]
  },
  {
    "code": "a836",
    "title": "a836. CPE：Simply Subsets (UVa 496)",
    "samples": [
      {
        "input": "55 27\n55 27\n9 24 1995\n9 24\n1 2 3\n1 2 3 4\n1 2 3\n4 5 6\n1 2\n2 3\n",
        "output": "A equals B\nB is a proper subset of A\nA is a proper subset of B\nA and B are disjoint\nI'm confused!\n"
      }
    ]
  },
  {
    "code": "a837",
    "title": "a837. CPE：Triangle Wave (UVa 488)",
    "samples": [
      {
        "input": "1\n3\n2\n",
        "output": "1\n22\n333\n22\n1\n\n1\n22\n333\n22\n1\n"
      }
    ]
  },
  {
    "code": "a838",
    "title": "a838. CPE：The Decoder (UVa 458)",
    "samples": [
      {
        "input": "1JKJ'pz'{ol'{yhklthyr'vm'{ol'Jvu{yvs'Kh{h'Jvywvyh{pvu5\n1PIT'pz'h'{yhklthyr'vm'{ol'Pu{lyuh{pvuhs'I|zpulzz'Thjopul'Jvywvyh{pvu5\n1KLJ'pz'{ol'{yhklthyr'vm'{ol'Kpnp{hs'Lx|pwtlu{'Jvywvyh{pvu5\n",
        "output": "*CDC is the trademark of the Control Data Corporation.\n*IBM is a trademark of the International Business Machine Corporation.\n*DEC is the trademark of the Digital Equipment Corporation.\n"
      }
    ]
  },
  {
    "code": "a839",
    "title": "a839. CPE：The Skyline Problem (UVa 105)",
    "samples": [
      {
        "input": "1 11 5\n2 6 7\n3 13 9\n12 7 16\n14 3 25\n19 18 22\n23 13 29\n24 4 28\n",
        "output": "1 11 3 13 9 0 12 7 16 3 19 18 22 3 23 13 29 0\n"
      }
    ]
  },
  {
    "code": "a840",
    "title": "a840. CPE：Prime Cuts (UVa 406)",
    "samples": [
      {
        "input": "21 2\n18 2\n18 18\n100 7\n",
        "output": "21 2: 5 7 11\n\n18 2: 3 5 7 11\n\n18 18: 1 2 3 5 7 11 13 17\n\n100 7: 13 17 19 23 29 31 37 41 43 47 53 59 61 67\n\n"
      }
    ]
  },
  {
    "code": "a841",
    "title": "a841. CPE：Basically Speaking (UVa 389)",
    "samples": [
      {
        "input": "1111000 2 10\n1111000 2 16\n2102101 3 10\n2102101 3 15\n12312 4 2\n1A 15 2\nABCD 16 15\n03 13 10\n",
        "output": "    120\n     78\n   1765\n    7CA\n  ERROR\n  11001\n   D071\n      3\n"
      }
    ]
  },
  {
    "code": "a842",
    "title": "a842. CPE：Big Mod (UVa 374)",
    "samples": [
      {
        "input": "3\n18132\n17\n17\n1765\n3\n2374859\n3029382\n36123\n",
        "output": "13\n2\n13195\n"
      }
    ]
  },
  {
    "code": "a843",
    "title": "a843. CPE：Perfection (UVa 382)",
    "samples": [
      {
        "input": "15 28 6 56 60000 22 496 0\n",
        "output": "PERFECTION OUTPUT\n   15  DEFICIENT\n   28  PERFECT\n    6  PERFECT\n   56  ABUNDANT\n60000  ABUNDANT\n   22  DEFICIENT\n  496  PERFECT\nEND OF OUTPUT\n"
      }
    ]
  },
  {
    "code": "a844",
    "title": "a844. CPE：Let Me Count The Ways (UVa 357)",
    "samples": [
      {
        "input": "17\n11\n4\n",
        "output": "There are 6 ways to produce 17 cents change.\nThere are 4 ways to produce 11 cents change.\nThere is only 1 way to produce 4 cents change.\n"
      }
    ]
  },
  {
    "code": "a845",
    "title": "a845. CPE：Quirksome Squares (UVa 256)",
    "samples": [
      {
        "input": "2\n2\n",
        "output": "00\n01\n81\n00\n01\n81\n"
      }
    ]
  },
  {
    "code": "a846",
    "title": "a846. CPE：Inception (UVa 13055)",
    "samples": [
      {
        "input": "20\nSleep Dom\nSleep Sakin\nTest\nSleep Asif\nSleep Mushfiq\nTest\nKick\nTest\nSleep Shafi\nTest\nKick\nTest\nKick\nTest\nKick\nTest\nKick\nTest\nKick\nTest\n",
        "output": "Sakin\nMushfiq\nAsif\nShafi\nAsif\nSakin\nDom\nNot in a dream\nNot in a dream\n"
      }
    ]
  },
  {
    "code": "a847",
    "title": "a847. CPE：Cool Word (UVa 12820)",
    "samples": [
      {
        "input": "2\nada\nbbacccd\n2\nillness\na\n",
        "output": "Case 1: 1\nCase 2: 0\n"
      }
    ]
  }
];
