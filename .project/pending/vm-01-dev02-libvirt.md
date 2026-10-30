---
title: Give dev02's libvirt a pool, a network and an image
plans:
  - plans/container/20261030-1141-a-vm-is-made-on-a-server/plan.md
---

# Give dev02's libvirt a pool, a network and an image

Task 01 of the VM plan. dev02 has libvirt 11.3 and virt-install 5.0, and `softov` is in the `libvirt` and `kvm` groups. It has no storage pool, its `default` network is inactive, and it has no image. This workstation has no `virsh` and no `virt-install`.
dev02 also runs other services. These steps add a pool, a NAT network on `virbr0` and two firewall rules, and change nothing else.
dev02 has about 19 GB free on `/`. The image is 330 MB, and each VM is a linked clone of a template.

## Steps

1. On this workstation, install the clients: `sudo apt install libvirt-clients virtinst`.
2. On dev02, make the `default` pool: `virsh -c qemu:///system pool-define-as default dir --target /var/lib/libvirt/images`.
3. Build, start and autostart it: `virsh -c qemu:///system pool-build default && virsh -c qemu:///system pool-start default && virsh -c qemu:///system pool-autostart default`.
4. Start and autostart the `default` network: `virsh -c qemu:///system net-start default && virsh -c qemu:///system net-autostart default`.
5. Let VM traffic past Docker's `FORWARD DROP`: `sudo iptables -I DOCKER-USER -i virbr0 -j ACCEPT` and `sudo iptables -I DOCKER-USER -o virbr0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT`.
6. Put the Debian 13 cloud image in the pool: `sudo curl -fLo /var/lib/libvirt/images/debian-13-genericcloud-amd64.qcow2 https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2 && virsh -c qemu:///system pool-refresh default`.
7. From this workstation, check `virsh -c qemu+ssh://dev02/system vol-list default` lists the image.

The rules of step 5 do not survive a reboot of dev02. Say if you want them kept, for example by a `DOCKER-USER` line in a systemd unit after `docker.service`.

## Reply

Write "done" when step 7 lists the image, or say which step stopped.
